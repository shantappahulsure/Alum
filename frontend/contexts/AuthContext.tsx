"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

import {
  loginUser,
  registerUser,
  logoutUser,
  validateAccessToken,
  forgotPassword as apiRequestPasswordReset,
  resetPassword as apiResetPassword,
  hasPermission,
} from "@/lib/auth";

import {
  User,
  RegisterData,
} from "@/lib/types";

import {
  useRouter,
  usePathname,
} from "next/navigation";

import LoadingSpinner from "@/components/ui/loading-spinner";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";

/*
========================================
CONTEXT TYPES
========================================
*/

export interface AuthContextType {
  user: User | null;

  loading: boolean;

  error: string | null;

  isAuthenticated: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  register: (
    userData: RegisterData
  ) => Promise<void>;

  logout: (
    redirectPath?: string
  ) => Promise<void>;

  clearError: () => void;

  forgotPassword: (
    email: string
  ) => Promise<void>;

  resetPassword: (
    token: string,
    email: string,
    newPassword: string
  ) => Promise<void>;

  checkPermission: (
    requiredRoles: string[]
  ) => boolean;
}

/*
========================================
DEFAULT CONTEXT
========================================
*/

export const AuthContext =
  createContext<AuthContextType>({
    user: null,

    loading: true,

    error: null,

    isAuthenticated: false,

    login: async () => {},

    register: async () => {},

    logout: async () => {},

    clearError: () => {},

    forgotPassword:
      async () => {},

    resetPassword:
      async () => {},

    checkPermission:
      () => false,
  });

/*
========================================
AUTH PROVIDER
========================================
*/

export const AuthProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    initializationAttempted,
    setInitializationAttempted,
  ] = useState<boolean>(false);

  const router = useRouter();

  const pathname =
    usePathname();

  /*
========================================
REDIRECT AFTER LOGIN
========================================
*/

  const handleRedirectAfterAuth =
    useCallback(() => {
      if (
        typeof window ===
        "undefined"
      )
        return;

      const urlParams =
        new URLSearchParams(
          window.location.search
        );

      const fromPath =
        urlParams.get("from");

      if (
        pathname ===
          "/login" &&
        fromPath
      ) {
        router.push(fromPath);
      }
    }, [pathname, router]);

  /*
========================================
LOAD USER FROM STORAGE
========================================
*/

  const loadUserFromLocalStorage =
    useCallback(() => {
      if (
        typeof window ===
        "undefined"
      )
        return null;

      const storedUser =
        localStorage.getItem(
          "user"
        );

      if (!storedUser)
        return null;

      try {
        return JSON.parse(
          storedUser
        );
      } catch (e) {
        console.error(
          "Failed to parse user:",
          e
        );

        return null;
      }
    }, []);

  /*
========================================
CHECK AUTH STATUS
========================================
*/

  const checkAuthStatus =
    useCallback(() => {
      if (
        typeof window ===
        "undefined"
      )
        return false;

      const accessToken =
        localStorage.getItem(
          "accessToken"
        );

      const refreshToken =
        localStorage.getItem(
          "refreshToken"
        );

      const isLoggedIn =
        localStorage.getItem(
          "isLoggedIn"
        ) === "true";

      return (
        isLoggedIn &&
        (!!accessToken ||
          !!refreshToken)
      );
    }, []);

  /*
========================================
ADD TOKEN TO FETCH
========================================
*/

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    )
      return;

    const originalFetch =
      window.fetch;

    window.fetch = async (
      url,
      options = {}
    ) => {
      const accessToken =
        localStorage.getItem(
          "accessToken"
        );

      const headers = {
        ...options.headers,

        ...(accessToken
          ? {
              "x-access-token":
                accessToken,
            }
          : {}),
      };

      return originalFetch(url, {
        ...options,
        headers,
      });
    };

    return () => {
      window.fetch =
        originalFetch;
    };
  }, []);

  /*
========================================
INITIALIZE AUTH
========================================
*/

  useEffect(() => {
    let isMounted = true;

    if (
      initializationAttempted &&
      !checkAuthStatus()
    ) {
      return;
    }

    const initAuth =
      async () => {
        const isLoggedIn =
          checkAuthStatus();

        if (!isLoggedIn) {
          if (isMounted) {
            setLoading(false);

            setInitializationAttempted(
              true
            );
          }

          return;
        }

        try {
          setLoading(true);

          /*
========================================
LOAD STORED USER
========================================
*/

          const storedUser =
            loadUserFromLocalStorage();

          if (
            storedUser &&
            isMounted
          ) {
            setUser(
              storedUser
            );
          }

          /*
========================================
VALIDATE TOKEN
========================================
*/

          try {
            const accessToken =
              localStorage.getItem(
                "accessToken"
              );

            if (
              accessToken
            ) {
              const validatedUser =
                await validateAccessToken(
                  accessToken
                );

              if (
                isMounted
              ) {
                setUser(
                  validatedUser
                );

                /*
========================================
STORE USER WITH EMAIL
========================================
*/

                localStorage.setItem(
                  "user",

                  JSON.stringify({
                    ...validatedUser,

                    email:
                      validatedUser.email ||
                      
                      "",
                  })
                );

                handleRedirectAfterAuth();
              }
            } else {
              throw new Error(
                "No access token found"
              );
            }
          } catch (apiErr) {
            console.error(
              "Token validation failed:",
              apiErr
            );

            const accessToken =
              localStorage.getItem(
                "accessToken"
              );

            const refreshToken =
              localStorage.getItem(
                "refreshToken"
              );

            const isUnauthorized =
              (
                apiErr as any
              )?.response
                ?.status ===
              401;

            if (
              (!accessToken &&
                !refreshToken) ||
              isUnauthorized
            ) {
              if (
                isMounted
              ) {
                setUser(
                  null
                );

                localStorage.removeItem(
                  "isLoggedIn"
                );

                localStorage.removeItem(
                  "user"
                );
              }
            }
          }
        } catch (err) {
          console.error(
            "Auth initialization error:",
            err
          );

          if (isMounted) {
            setUser(null);

            localStorage.removeItem(
              "isLoggedIn"
            );

            localStorage.removeItem(
              "user"
            );
          }
        } finally {
          if (isMounted) {
            setLoading(false);

            setInitializationAttempted(
              true
            );
          }
        }
      };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [
    handleRedirectAfterAuth,
    loadUserFromLocalStorage,
    initializationAttempted,
    checkAuthStatus,
  ]);

  /*
========================================
PERIODIC TOKEN VALIDATION
========================================
*/

  useEffect(() => {
    if (!user) return;

    const validationInterval =
      setInterval(
        async () => {
          try {
            const accessToken =
              localStorage.getItem(
                "accessToken"
              );

            if (
              accessToken
            ) {
              const validatedUser =
                await validateAccessToken(
                  accessToken
                );

              setUser(
                validatedUser
              );

              localStorage.setItem(
                "user",

                JSON.stringify({
                  ...validatedUser,

                  email:
                    validatedUser.email ||
                     
                    "",
                })
              );
            }
          } catch (err) {
            console.log(
              "Session validation failed",
              err
            );

            if (
              (
                err as any
              )?.response
                ?.status ===
              401
            ) {
              setUser(null);

              localStorage.removeItem(
                "isLoggedIn"
              );

              localStorage.removeItem(
                "user"
              );

              localStorage.removeItem(
                "accessToken"
              );

              localStorage.removeItem(
                "refreshToken"
              );
            }
          }
        },

        10 * 60 * 1000
      );

    return () =>
      clearInterval(
        validationInterval
      );
  }, [user]);

/*
========================================
SOCKET CONNECTION
========================================
*/

useEffect(() => {
  if (!user?.username) {
    return;
  }

  /*
  ========================================
  CONNECT SOCKET
  ========================================
  */

  if (!socket.connected) {
    socket.connect();

    console.log(
      "SOCKET CONNECTING..."
    );
  }

  /*
  ========================================
  JOIN USER ROOM
  ========================================
  */

  const joinUserRoom = () => {
    socket.emit(
      "join",
      user.username
    );

    console.log(
      "JOINED ROOM:",
      user.username
    );
  };

  /*
  ========================================
  IF ALREADY CONNECTED
  ========================================
  */

  if (socket.connected) {
    joinUserRoom();
  }

  /*
  ========================================
  CONNECT EVENT
  ========================================
  */

  const onConnect = () => {
    console.log(
      "SOCKET CONNECTED:",
      socket.id
    );

    joinUserRoom();
  };

  /*
  ========================================
  DISCONNECT EVENT
  ========================================
  */

  const onDisconnect = () => {
    console.log(
      "SOCKET DISCONNECTED"
    );
  };

  /*
  ========================================
  REFERRAL EVENT
  ========================================
  */

  const onNewReferral = (
    data: any
  ) => {
    console.log(
      "NEW REFERRAL:",
      data
    );

    toast.success(
      data.message
    );
  };

  /*
  ========================================
  STATUS EVENT
  ========================================
  */

  const onStatusUpdate = (
    data: any
  ) => {
    toast.success(
      data.message
    );
  };

  /*
  ========================================
  REGISTER EVENTS
  ========================================
  */

  socket.on(
    "connect",
    onConnect
  );

  socket.on(
    "disconnect",
    onDisconnect
  );

  socket.on(
    "newReferral",
    onNewReferral
  );

  socket.on(
    "referralStatusUpdated",
    onStatusUpdate
  );

  /*
  ========================================
  CLEANUP
  ========================================
  */

  return () => {
    socket.off(
      "connect",
      onConnect
    );

    socket.off(
      "disconnect",
      onDisconnect
    );

    socket.off(
      "newReferral",
      onNewReferral
    );

    socket.off(
      "referralStatusUpdated",
      onStatusUpdate
    );
  };
}, [user?.username]);
  /*
========================================
LOGIN
========================================
*/

  const login = async (
    email: string,
    password: string
  ) => {
    try {
      setLoading(true);

      setError(null);

      const {
        user: userData,
      } = await loginUser(
        email,
        password
      );

      setUser(userData);

      /*
========================================
STORE USER
========================================
*/

      localStorage.setItem(
        "user",

        JSON.stringify(
          userData
        )
      );

      handleRedirectAfterAuth();
    } catch (err: any) {
      setError(
        err.message ||
          "Login failed"
      );

      throw err;
    } finally {
      setLoading(false);
    }
  };

  /*
========================================
REGISTER
========================================
*/

  const register = async (
    userData: RegisterData
  ) => {
    try {
      setLoading(true);

      setError(null);

      const {
        user: newUser,
      } = await registerUser(
        userData
      );

      setUser(newUser);

      localStorage.setItem(
        "user",

        JSON.stringify(
          newUser
        )
      );

      handleRedirectAfterAuth();
    } catch (err: any) {
      setError(
        err.message ||
          "Registration failed"
      );

      throw err;
    } finally {
      setLoading(false);
    }
  };

  /*
========================================
LOGOUT
========================================
*/

  const logout =
    useCallback(
      async (
        redirectPath = "/"
      ) => {
        try {
          setLoading(true);

          await logoutUser();
        } catch (err: any) {
          setError(
            err.message ||
              "Logout failed"
          );
        } finally {
          setUser(null);

          setLoading(false);

          router.push(
            redirectPath
          );
        }
      },

      [router]
    );

  /*
========================================
FORGOT PASSWORD
========================================
*/

  const forgotPassword =
    async (
      email: string
    ) => {
      try {
        setLoading(true);

        setError(null);

        await apiRequestPasswordReset(
          email
        );
      } catch (err: any) {
        setError(
          err.message ||
            "Password reset failed"
        );

        throw err;
      } finally {
        setLoading(false);
      }
    };

  /*
========================================
RESET PASSWORD
========================================
*/

  const resetPassword =
    async (
      token: string,
      email: string,
      newPassword: string
    ) => {
      try {
        setLoading(true);

        setError(null);

        await apiResetPassword(
          token,
          email,
          newPassword
        );
      } catch (err: any) {
        setError(
          err.message ||
            "Password reset failed"
        );

        throw err;
      } finally {
        setLoading(false);
      }
    };

  /*
========================================
CLEAR ERROR
========================================
*/

  const clearError = () => {
    setError(null);
  };

  /*
========================================
CHECK PERMISSION
========================================
*/

  const checkPermission = (
    requiredRoles: string[]
  ): boolean => {
    return hasPermission(
      user,
      requiredRoles
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,

        loading,

        error,

        isAuthenticated:
          !!user,

        login,

        register,

        logout,

        clearError,

        forgotPassword,

        resetPassword,

        checkPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/*
========================================
HOOK
========================================
*/

export const useAuth = () =>
  useContext(AuthContext);

/*
========================================
WITH AUTH
========================================
*/

export const withAuth = (
  Component: React.ComponentType<any>
) => {
  const AuthenticatedComponent = (
    props: any
  ) => {
    const {
      isAuthenticated,
      loading,
    } = useAuth();

    const router =
      useRouter();

    const pathname =
      usePathname();

    useEffect(() => {
      if (
        !loading &&
        !isAuthenticated
      ) {
        router.replace(
          `/login?from=${encodeURIComponent(
            pathname
          )}`
        );
      }
    }, [
      loading,
      isAuthenticated,
      router,
      pathname,
    ]);

    if (loading) {
      return (
        <div>
          <LoadingSpinner />
        </div>
      );
    }

    return isAuthenticated ? (
      <Component
        {...props}
      />
    ) : null;
  };

  return AuthenticatedComponent;
};

/*
========================================
WITH ROLE
========================================
*/

export const withRole = (
  Component: React.ComponentType<any>,
  allowedRoles: string[]
) => {
  const AuthorizedComponent = (
    props: any
  ) => {
    const {
      loading,
      isAuthenticated,
      checkPermission,
    } = useAuth();

    const router =
      useRouter();

    const pathname =
      usePathname();

    const hasAccess =
      checkPermission(
        allowedRoles
      );

    useEffect(() => {
      if (!loading) {
        if (
          !isAuthenticated
        ) {
          router.replace(
            `/login?from=${encodeURIComponent(
              pathname
            )}`
          );
        } else if (
          !hasAccess
        ) {
          router.replace(
            "/unauthorized"
          );
        }
      }
    }, [
      loading,
      isAuthenticated,
      hasAccess,
      router,
      pathname,
    ]);

    if (loading) {
      return (
        <div>
          <LoadingSpinner />
        </div>
      );
    }

    return isAuthenticated &&
      hasAccess ? (
      <Component
        {...props}
      />
    ) : null;
  };

  return AuthorizedComponent;
};