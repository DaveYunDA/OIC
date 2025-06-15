/**
 * 用户凭证类型定义，用于身份认证。
 */
export interface Credentials {
  /**
   * 用户名
   */
  username: string;
  /**
   * 用户密码（加密或摘要）
   */
  passwordDigest: string;
}

/**
 * 认证结果类型定义。
 */
export interface AuthResult {
  /**
   * 是否认证成功
   */
  success: boolean;
  /**
   * 失败时的错误信息（可选）
   */
  error?: string;
}

/**
 * 异步认证函数，根据传入的凭证判断用户是否合法。
 *
 * @param credentials 用户凭证
 * @returns Promise<AuthResult> 返回认证结果
 */
export async function authenticate(credentials: Credentials): Promise<AuthResult> {
  // TODO: 实际项目中应通过 API 校验，这里为演示做本地判断。
  if (credentials.username === process.env.ADMIN_USERNAME && credentials.passwordDigest === process.env.ADMIN_PASSWORD_DIGEST) {
    return {
      success: true,
    };
  } else {
    return {
      success: false,
      error: 'Invalid credentials', // 认证失败
    };
  }
}
