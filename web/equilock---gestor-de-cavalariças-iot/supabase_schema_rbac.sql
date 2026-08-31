-- ==============================================================================
-- EQUILOCK / GALLOPIT - SCHEMA SQL E POLÍTICAS RLS NO SUPABASE
-- Sistema de Autenticação e Gestão de Permissões RBAC (DEVELOPER, CLIENT_ADMIN, OPERATOR)
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPO ENUM DE PERFIS (ROLES)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('DEVELOPER', 'CLIENT_ADMIN', 'OPERATOR');
  END IF;
END $$;

-- 3. TABELA: PROFILES (VINCULADA A AUTH.USERS)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'OPERATOR',
  client_admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexação para performance de busca
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_client_admin ON public.profiles(client_admin_id);

-- 4. TABELA: MACHINES (ARMÁRIOS / MÁQUINAS IOT REGISTADAS)
CREATE TABLE IF NOT EXISTS public.machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial_number TEXT UNIQUE NOT NULL,
  mac_address TEXT,
  name TEXT NOT NULL,
  client_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  mqtt_topic TEXT,
  boxes_count INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance')),
  operating_mode TEXT NOT NULL DEFAULT 'DELAY' CHECK (operating_mode IN ('DELAY', 'AGENDA')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machines_client_admin ON public.machines(client_admin_id);
CREATE INDEX IF NOT EXISTS idx_machines_serial ON public.machines(serial_number);

-- 5. TABELA: USER_MACHINE_ACCESS (PERMISSÕES GRANULARES POR UTILIZADOR)
CREATE TABLE IF NOT EXISTS public.user_machine_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  allowed_boxes INTEGER[] DEFAULT '{1,2,3,4}',
  can_trigger_sequence BOOLEAN NOT NULL DEFAULT TRUE,
  can_modify_schedule BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_machine UNIQUE(user_id, machine_id)
);

CREATE INDEX IF NOT EXISTS idx_user_machine_user ON public.user_machine_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_machine_machine ON public.user_machine_access(machine_id);

-- 6. TABELA: AUDIT_LOGS (HISTÓRICO DE AUDITORIA E EVENTOS IOT)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  box_number INTEGER,
  mode TEXT NOT NULL DEFAULT 'MANUAL',
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_client ON public.audit_logs(client_admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_machine ON public.audit_logs(machine_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 7. FUNÇÃO HELPER: VERIFICAR ROLE ATUAL DO UTILIZADOR AUTENTICADO
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Função Helper: Obter o client_admin_id do utilizador autenticado
CREATE OR REPLACE FUNCTION public.get_auth_client_admin_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN role = 'CLIENT_ADMIN' THEN id
      WHEN role = 'OPERATOR' THEN client_admin_id
      ELSE NULL
    END
  FROM public.profiles 
  WHERE id = auth.uid();
$$;

-- ==============================================================================
-- 8. TRIGGER AUTOMÁTICO: CRIAR PROFILE AO REGISTAR NO SUPABASE AUTH
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  assigned_role user_role := 'OPERATOR';
  assigned_client UUID := NULL;
  assigned_name TEXT := '';
  assigned_company TEXT := '';
BEGIN
  -- Se existirem dados nos raw_user_meta_data
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    assigned_role := (NEW.raw_user_meta_data->>'role')::user_role;
  END IF;

  IF NEW.raw_user_meta_data->>'client_admin_id' IS NOT NULL THEN
    assigned_client := (NEW.raw_user_meta_data->>'client_admin_id')::UUID;
  END IF;

  IF NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
    assigned_name := NEW.raw_user_meta_data->>'full_name';
  ELSE
    assigned_name := split_part(NEW.email, '@', 1);
  END IF;

  IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    assigned_company := NEW.raw_user_meta_data->>'company_name';
  END IF;

  -- Inserir perfil
  INSERT INTO public.profiles (id, email, full_name, role, client_admin_id, company_name)
  VALUES (NEW.id, NEW.email, assigned_name, assigned_role, assigned_client, assigned_company)
  ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        client_admin_id = EXCLUDED.client_admin_id,
        company_name = EXCLUDED.company_name,
        updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Vincular trigger à tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 9. CONFIGURAÇÃO DE POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

-- Ativar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_machine_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 9.1 POLÍTICAS PARA A TABELA `profiles`
-- ------------------------------------------------------------------------------

-- DEVELOPER: Pode ver, criar e alterar todos os perfis
CREATE POLICY "Developer tem acesso total aos perfis"
ON public.profiles
FOR ALL
TO authenticated
USING (public.get_auth_role() = 'DEVELOPER');

-- CLIENT_ADMIN: Pode ver o seu próprio perfil e os OPERATORs da sua empresa
CREATE POLICY "Client Admin vê e gere utilizadores da sua organização"
ON public.profiles
FOR ALL
TO authenticated
USING (
  id = auth.uid() 
  OR client_admin_id = auth.uid()
)
WITH CHECK (
  id = auth.uid() 
  OR (client_admin_id = auth.uid() AND role = 'OPERATOR')
);

-- OPERATOR: Apenas visualiza o seu próprio perfil e o perfil do seu admin
CREATE POLICY "Operator vê o seu próprio perfil"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() 
  OR id = (SELECT client_admin_id FROM public.profiles WHERE id = auth.uid())
);

-- ------------------------------------------------------------------------------
-- 9.2 POLÍTICAS PARA A TABELA `machines`
-- ------------------------------------------------------------------------------

-- DEVELOPER: Acesso irrestrito a registo, leitura e edição de máquinas
CREATE POLICY "Developer pode gerir todas as máquinas"
ON public.machines
FOR ALL
TO authenticated
USING (public.get_auth_role() = 'DEVELOPER')
WITH CHECK (public.get_auth_role() = 'DEVELOPER');

-- CLIENT_ADMIN: Visualiza e edita apenas as máquinas associadas à sua conta
CREATE POLICY "Client Admin acede às suas máquinas atribuídas"
ON public.machines
FOR ALL
TO authenticated
USING (
  client_admin_id = auth.uid() 
  AND public.get_auth_role() = 'CLIENT_ADMIN'
)
WITH CHECK (
  client_admin_id = auth.uid() 
  AND public.get_auth_role() = 'CLIENT_ADMIN'
);

-- OPERATOR: Apenas visualiza as máquinas às quais tem permissão explícita
CREATE POLICY "Operator acede apenas às máquinas permitidas"
ON public.machines
FOR SELECT
TO authenticated
USING (
  public.get_auth_role() = 'OPERATOR'
  AND id IN (
    SELECT machine_id FROM public.user_machine_access WHERE user_id = auth.uid()
  )
);

-- OPERATOR: Pode atualizar o modo operacional ou status se tiver acesso
CREATE POLICY "Operator pode enviar comandos para as suas máquinas"
ON public.machines
FOR UPDATE
TO authenticated
USING (
  public.get_auth_role() = 'OPERATOR'
  AND id IN (
    SELECT machine_id FROM public.user_machine_access WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  public.get_auth_role() = 'OPERATOR'
  AND id IN (
    SELECT machine_id FROM public.user_machine_access WHERE user_id = auth.uid()
  )
);

-- ------------------------------------------------------------------------------
-- 9.3 POLÍTICAS PARA A TABELA `user_machine_access`
-- ------------------------------------------------------------------------------

-- DEVELOPER: Acesso total
CREATE POLICY "Developer gere todas as atribuições de acesso"
ON public.user_machine_access
FOR ALL
TO authenticated
USING (public.get_auth_role() = 'DEVELOPER');

-- CLIENT_ADMIN: Gere permissões dos operadores da sua empresa sobre as suas máquinas
CREATE POLICY "Client Admin gere acessos dos seus operadores"
ON public.user_machine_access
FOR ALL
TO authenticated
USING (
  machine_id IN (
    SELECT id FROM public.machines WHERE client_admin_id = auth.uid()
  )
  AND user_id IN (
    SELECT id FROM public.profiles WHERE client_admin_id = auth.uid()
  )
)
WITH CHECK (
  machine_id IN (
    SELECT id FROM public.machines WHERE client_admin_id = auth.uid()
  )
  AND user_id IN (
    SELECT id FROM public.profiles WHERE client_admin_id = auth.uid()
  )
);

-- OPERATOR: Apenas visualiza os seus próprios acessos
CREATE POLICY "Operator visualiza as suas próprias permissões"
ON public.user_machine_access
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 9.4 POLÍTICAS PARA A TABELA `audit_logs`
-- ------------------------------------------------------------------------------

-- DEVELOPER: Vê todos os logs
CREATE POLICY "Developer visualiza todos os logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.get_auth_role() = 'DEVELOPER');

-- CLIENT_ADMIN: Vê logs das suas máquinas e utilizadores
CREATE POLICY "Client Admin visualiza logs da sua organização"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  client_admin_id = auth.uid() 
  OR machine_id IN (SELECT id FROM public.machines WHERE client_admin_id = auth.uid())
);

-- TODOS OS AUTENTICADOS: Podem inserir novos logs ao operar baias/máquinas
CREATE POLICY "Utilizadores autenticados podem registar eventos de auditoria"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- ==============================================================================
-- 10. ATIVAR REALTIME NO SUPABASE (OPCIONAL / RECOMENDADO)
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.machines;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_machine_access;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignora se as tabelas já estiverem na publicação
  NULL;
END $$;

-- ==============================================================================
-- 11. DADOS INICIAIS DEMONSTRATIVOS (SEEDS)
-- ==============================================================================
-- Exemplo de máquinas prontas para teste no seu armário IoT:
-- INSERT INTO public.machines (serial_number, mac_address, name, mqtt_topic, status, operating_mode)
-- VALUES 
--   ('EQ-8842-PT', '24:6F:28:9A:C3:01', 'Armário 1 - Celeiro Principal', 'armario1', 'online', 'DELAY'),
--   ('EQ-9915-PT', '3C:71:BF:12:44:8E', 'Armário 2 - Paddock B', 'armario2', 'online', 'AGENDA')
-- ON CONFLICT (serial_number) DO NOTHING;
