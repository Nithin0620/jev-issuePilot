import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/repos/:path*",
    "/inbox/:path*",
    "/history/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
  ],
};
