import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { AuthContext } from '../../hooks/useAuth'
import type { AuthContextValue, EmployeeProfile } from '../../types/auth'

interface ProfileRow {
  employee_id: string
}

interface EmployeeRow {
  id: string
  employee_number: string | null
  full_name: string
  company_email: string
  location_id: string | null
  is_active: boolean
}

interface EmployeeRoleRow {
  role_id: string
}

interface RoleRow {
  id: string
  code: string
  name: string
}

type ProfileLoadStage = 'profiles' | 'employees' | 'employee_roles' | 'roles'

interface QueryError {
  message: string
  code?: string
  details?: string
  hint?: string
  status?: number
}

type LogContext = Record<string, string | number | boolean | null | undefined>

function logQueryFailure(
  stage: ProfileLoadStage,
  error: QueryError,
  context: LogContext,
) {
  console.error(`[Lomeza auth] ${stage} query failed`, {
    stage,
    message: error.message,
    code: error.code ?? null,
    status: error.status ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    ...context,
  })
}

function logMissingRecord(
  stage: 'profiles' | 'employees',
  context: LogContext,
) {
  console.warn(`[Lomeza auth] ${stage} record not found`, {
    stage,
    ...context,
    hint: 'No row was returned. Verify the record exists and that the RLS SELECT policy allows the authenticated user to read it.',
  })
}

function logUnexpectedProfileError(
  stage: ProfileLoadStage,
  error: unknown,
  userId: string,
) {
  if (error instanceof Error) {
    console.error('[Lomeza auth] unexpected profile-loading exception', {
      stage,
      userId,
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    })
    return
  }

  console.error('[Lomeza auth] unexpected profile-loading exception', {
    stage,
    userId,
    name: typeof error,
  })
}

const GENERIC_AUTH_ERROR =
  'We could not sign you in. Please try again or contact your administrator.'
const NETWORK_ERROR =
  'Unable to reach the authentication service. Check your connection and try again.'
const PROFILE_LOAD_ERROR =
  'We could not load your employee profile. Please try again or contact your administrator.'
const MISSING_PROFILE_ERROR =
  'No employee profile is linked to this account. Please contact your administrator.'
const ROLES_LOAD_ERROR =
  'We could not load your access roles. Please try again or contact your administrator.'
const PASSWORD_UPDATE_ERROR =
  'We could not update your password. Please try again or contact your administrator.'

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'The company email or password is incorrect.'
  }

  if (normalized.includes('email not confirmed')) {
    return 'This account has not been verified. Please contact your administrator.'
  }

  if (
    normalized.includes('too many requests') ||
    normalized.includes('rate limit')
  ) {
    return 'Too many sign-in attempts. Please wait a few minutes and try again.'
  }

  if (normalized.includes('network') || normalized.includes('fetch')) {
    return NETWORK_ERROR
  }

  return GENERIC_AUTH_ERROR
}

function mapPasswordError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('weak') || normalized.includes('password should')) {
    return 'That password is not strong enough. Choose a longer, more unique password.'
  }

  if (
    normalized.includes('different') ||
    normalized.includes('same password')
  ) {
    return 'Your new password must be different from your current password.'
  }

  if (
    normalized.includes('too many requests') ||
    normalized.includes('rate limit')
  ) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }

  if (normalized.includes('network') || normalized.includes('fetch')) {
    return NETWORK_ERROR
  }

  return PASSWORD_UPDATE_ERROR
}

function requiresPasswordChange(user: User): boolean {
  const trustedFlag = user.app_metadata?.must_change_password

  if (typeof trustedFlag === 'boolean') {
    return trustedFlag
  }

  return user.user_metadata?.must_change_password === true
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null)
  const [roleNames, setRoleNames] = useState<string[]>([])
  const [isInitializing, setIsInitializing] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  const profileRequestIdRef = useRef(0)
  const profileUserIdRef = useRef<string | null>(null)
  const passwordChangeCompletedForUserRef = useRef<string | null>(null)
  const passwordRecoveryUserIdRef = useRef<string | null>(null)

  const loadEmployeeProfile = useCallback(async (authUser: User) => {
    const requestId = profileRequestIdRef.current + 1
    profileRequestIdRef.current = requestId
    setIsProfileLoading(true)
    setProfileError(null)
    setEmployee(null)
    setRoleNames([])

    let stage: ProfileLoadStage = 'profiles'

    const isCurrentRequest = () => requestId === profileRequestIdRef.current

    const failProfile = (message: string) => {
      if (!isCurrentRequest()) {
        return
      }

      setProfileError(message)
      setEmployee(null)
      setRoleNames([])
    }

    try {
      const { data: profileRow, error: profileQueryError } = await supabase
        .from('profiles')
        .select('employee_id')
        .eq('id', authUser.id)
        .maybeSingle<ProfileRow>()

      if (!isCurrentRequest()) {
        return
      }

      if (profileQueryError) {
        logQueryFailure('profiles', profileQueryError, {
          userId: authUser.id,
        })
        failProfile(PROFILE_LOAD_ERROR)
        return
      }

      if (!profileRow?.employee_id) {
        logMissingRecord('profiles', { userId: authUser.id })
        failProfile(MISSING_PROFILE_ERROR)
        return
      }

      stage = 'employees'

      const { data: employeeRow, error: employeeQueryError } = await supabase
        .from('employees')
        .select(
          'id, employee_number, full_name, company_email, location_id, is_active',
        )
        .eq('id', profileRow.employee_id)
        .maybeSingle<EmployeeRow>()

      if (!isCurrentRequest()) {
        return
      }

      if (employeeQueryError) {
        logQueryFailure('employees', employeeQueryError, {
          userId: authUser.id,
          employeeId: profileRow.employee_id,
        })
        failProfile(PROFILE_LOAD_ERROR)
        return
      }

      if (!employeeRow) {
        logMissingRecord('employees', {
          userId: authUser.id,
          employeeId: profileRow.employee_id,
        })
        failProfile(PROFILE_LOAD_ERROR)
        return
      }

      const profile: EmployeeProfile = {
        id: employeeRow.id,
        employee_number: employeeRow.employee_number,
        full_name: employeeRow.full_name,
        company_email: employeeRow.company_email,
        location_id: employeeRow.location_id,
        is_active: employeeRow.is_active,
        roles: [],
      }

      if (!employeeRow.is_active) {
        console.warn('[Lomeza auth] employee profile is inactive', {
          userId: authUser.id,
          employeeId: employeeRow.id,
        })
        setEmployee(profile)
        return
      }

      stage = 'employee_roles'

      const { data: employeeRoleRows, error: employeeRolesError } =
        await supabase
          .from('employee_roles')
          .select('role_id')
          .eq('employee_id', employeeRow.id)
          .returns<EmployeeRoleRow[]>()

      if (!isCurrentRequest()) {
        return
      }

      if (employeeRolesError) {
        logQueryFailure('employee_roles', employeeRolesError, {
          userId: authUser.id,
          employeeId: employeeRow.id,
        })
        failProfile(ROLES_LOAD_ERROR)
        return
      }

      const roleIds = Array.from(
        new Set((employeeRoleRows ?? []).map((row) => row.role_id)),
      )

      if (roleIds.length === 0) {
        setEmployee(profile)
        return
      }

      stage = 'roles'

      const { data: roleRows, error: rolesError } = await supabase
        .from('roles')
        .select('id, code, name')
        .in('id', roleIds)
        .returns<RoleRow[]>()

      if (!isCurrentRequest()) {
        return
      }

      if (rolesError) {
        logQueryFailure('roles', rolesError, {
          userId: authUser.id,
          employeeId: employeeRow.id,
          roleCount: roleIds.length,
          roleIds: roleIds.join(','),
        })
        failProfile(ROLES_LOAD_ERROR)
        return
      }

      const returnedRoleCount = roleRows?.length ?? 0

      if (returnedRoleCount < roleIds.length) {
        console.warn(
          '[Lomeza auth] roles query returned fewer rows than requested',
          {
            userId: authUser.id,
            employeeId: employeeRow.id,
            requested: roleIds.length,
            received: returnedRoleCount,
          },
        )
      }

      const roleCodes = Array.from(
        new Set(
          (roleRows ?? [])
            .map((role) => role.code)
            .filter((code) => code.length > 0),
        ),
      )
      const roleNameList = Array.from(
        new Set(
          (roleRows ?? [])
            .map((role) => role.name)
            .filter((name) => name.length > 0),
        ),
      )

      setRoleNames(roleNameList)
      setEmployee({ ...profile, roles: roleCodes })
    } catch (error) {
      logUnexpectedProfileError(stage, error, authUser.id)
      failProfile(PROFILE_LOAD_ERROR)
    } finally {
      if (isCurrentRequest()) {
        setIsProfileLoading(false)
      }
    }
  }, [])

  const applySession = useCallback(
    (nextSession: Session | null) => {
      const nextUser = nextSession?.user ?? null

      setSession(nextSession)
      setUser(nextUser)

      if (!nextUser) {
        profileRequestIdRef.current += 1
        profileUserIdRef.current = null
        passwordChangeCompletedForUserRef.current = null
        passwordRecoveryUserIdRef.current = null
        setEmployee(null)
        setRoleNames([])
        setProfileError(null)
        setIsPasswordRecovery(false)
        setMustChangePassword(false)
        setIsProfileLoading(false)
        setIsInitializing(false)
        return
      }

      setAuthError(null)

      const recoveryActive =
        passwordRecoveryUserIdRef.current === nextUser.id
      setIsPasswordRecovery(recoveryActive)

      const passwordChangeRequired =
        (recoveryActive || requiresPasswordChange(nextUser)) &&
        passwordChangeCompletedForUserRef.current !== nextUser.id
      setMustChangePassword(passwordChangeRequired)

      if (profileUserIdRef.current === nextUser.id) {
        setIsInitializing(false)
        return
      }

      profileUserIdRef.current = nextUser.id
      void loadEmployeeProfile(nextUser).finally(() => {
        setIsInitializing(false)
      })
    },
    [loadEmployeeProfile],
  )

  useEffect(() => {
    let cancelled = false
    let receivedAuthEvent = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      receivedAuthEvent = true

      if (event === 'PASSWORD_RECOVERY') {
        passwordRecoveryUserIdRef.current = nextSession?.user?.id ?? null
        passwordChangeCompletedForUserRef.current = null
        setIsPasswordRecovery(Boolean(nextSession?.user))

        if (nextSession?.user) {
          setSession(nextSession)
          setUser(nextSession.user)
          setMustChangePassword(true)
        }

        console.info('[Lomeza auth] password recovery session detected', {
          userId: nextSession?.user?.id ?? null,
          hasSession: Boolean(nextSession?.user),
        })
      }

      window.setTimeout(() => {
        if (!cancelled) {
          applySession(nextSession)
        }
      }, 0)
    })

    void supabase.auth.getSession().then(({ data, error }) => {
      if (cancelled || receivedAuthEvent) {
        return
      }

      if (error) {
        setAuthError(
          'We could not restore your session. Please sign in again.',
        )
        setIsInitializing(false)
        return
      }

      applySession(data.session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [applySession])

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        return mapAuthError(error.message)
      }

      return null
    } catch {
      return NETWORK_ERROR
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        const message = 'We could not sign you out. Please try again.'
        setAuthError(message)
        return message
      }

      setAuthError(null)
      return null
    } catch {
      setAuthError(NETWORK_ERROR)
      return NETWORK_ERROR
    }
  }, [])

  const changePassword = useCallback(
    async (newPassword: string) => {
      try {
        const hasTrustedFlag =
          typeof user?.app_metadata?.must_change_password === 'boolean'
        const shouldClearUntrustedFlag =
          !hasTrustedFlag && user?.user_metadata?.must_change_password === true

        const { data, error } = await supabase.auth.updateUser(
          shouldClearUntrustedFlag
            ? {
                password: newPassword,
                data: { must_change_password: false },
              }
            : { password: newPassword },
        )

        if (error) {
          return mapPasswordError(error.message)
        }

        if (data.user) {
          const updatedUser = data.user
          setUser(updatedUser)
          setSession((current) =>
            current ? { ...current, user: updatedUser } : current,
          )
        }

        return null
      } catch {
        return PASSWORD_UPDATE_ERROR
      }
    },
    [user],
  )

  const completePasswordChange = useCallback(() => {
    if (user) {
      passwordChangeCompletedForUserRef.current = user.id
    }

    passwordRecoveryUserIdRef.current = null
    setIsPasswordRecovery(false)
    setMustChangePassword(false)
  }, [user])

  const retryProfile = useCallback(() => {
    if (!user) {
      return
    }

    profileUserIdRef.current = user.id
    void loadEmployeeProfile(user)
  }, [loadEmployeeProfile, user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      employee,
      roleNames,
      isInitializing,
      isProfileLoading,
      isLoading: isInitializing || isProfileLoading,
      authError,
      profileError,
      mustChangePassword,
      isPasswordRecovery,
      login,
      logout,
      changePassword,
      completePasswordChange,
      retryProfile,
    }),
    [
      user,
      session,
      employee,
      roleNames,
      isInitializing,
      isProfileLoading,
      authError,
      profileError,
      mustChangePassword,
      isPasswordRecovery,
      login,
      logout,
      changePassword,
      completePasswordChange,
      retryProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
