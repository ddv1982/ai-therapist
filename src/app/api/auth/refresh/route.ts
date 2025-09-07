import { NextResponse } from "next/server";
import { withApiMiddleware } from "@/lib/api/api-middleware";
import { ApiResponse } from "@/lib/api/api-response";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { logger } from "@/lib/utils/logger";

const ACCESS_TOKEN_TTL = 60 * 15; // 15 minutes
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30; // 30 days

async function signToken(payload: Record<string, unknown>, expiresIn: number) {
  return await new SignJWT(payload as import("jose").JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${expiresIn}s`)
    .sign(new TextEncoder().encode(process.env.JWT_SECRET as string));
}

export const POST = withApiMiddleware(async () => {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: { message: "No refresh token" } } as ApiResponse<null>,
        { status: 401 }
      );
    }

    let decoded: import("jose").JWTPayload;
    try {
      const { payload } = await jwtVerify(
        new TextEncoder().encode(refreshToken),
        new TextEncoder().encode(process.env.JWT_SECRET as string)
      );
      decoded = payload;
    } catch (err) {
      logger.warn("Invalid refresh token", { err });
      return NextResponse.json(
        { success: false, error: { message: "Invalid refresh token" } } as ApiResponse<null>,
        { status: 401 }
      );
    }

    // Issue new access token
    const newAccessToken = await signToken(
      { userId: decoded.userId },
      ACCESS_TOKEN_TTL
    );

    // Optionally rotate refresh token
    const newRefreshToken = await signToken(
      { userId: decoded.userId },
      REFRESH_TOKEN_TTL
    );

    // Set cookies
    const res = NextResponse.json(
      { success: true, data: { accessToken: newAccessToken } } as ApiResponse<{ accessToken: string }>
    );
    res.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: ACCESS_TOKEN_TTL,
    });
    res.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_TTL,
    });

    return res;
  } catch (error) {
    logger.apiError("/api/auth/refresh", error as Error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } } as ApiResponse<null>,
      { status: 500 }
    );
  }
});
