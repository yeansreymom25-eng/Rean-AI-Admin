import type { NextConfig } from "next";

/**
 * The admin talks to the gateway through its own origin.
 *
 * proxy.ts gates every admin page on a cookie the browser sends to *this*
 * host, and the gateway sets its auth cookies without a Domain attribute, so
 * they are host-only. Pointing the browser straight at the API hostname
 * therefore parks the session cookies on a host the admin can never read,
 * and the gate redirects to the login page forever however correct the
 * password is. The same split also hides the CSRF cookie from the client,
 * which needs to read it for every non-GET request.
 *
 * Proxying /api/v1 through this origin makes those cookies first-party: the
 * gate sees them, the client can read the CSRF token, and no cross-site
 * cookie rules apply. It is also what the note in proxy.ts asks for.
 */
const gateway = process.env.GATEWAY_ORIGIN ?? "https://aitutor.mekhla.digital";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${gateway}/api/v1/:path*` }];
  },

  /**
   * Pages must not be cached; the hashed assets they name should be.
   *
   * Next serves prerendered pages with s-maxage=31536000 -- a year. The page
   * is what names the hashed chunks, so a cached copy pins a browser to the
   * build it was rendered from. After the API moved to this origin, anyone
   * holding an older page kept calling the API hostname directly and got a
   * CORS error, with no way to know a newer build existed.
   *
   * Next already serves /_next/static with its own immutable cache policy, so
   * leave those headers to the framework. Re-declaring them here produces a
   * build warning and can interfere with development behavior.
   */
  async headers() {
    return [
      {
        source: "/:path((?!_next/static|_next/image).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
