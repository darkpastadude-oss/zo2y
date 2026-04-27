import { onRequest as __api___path___js_onRequest } from "C:\\Users\\sigma\\OneDrive\\Desktop\\zo2ys\\functions\\api\\[[path]].js"
import { onRequest as ___middleware_js_onRequest } from "C:\\Users\\sigma\\OneDrive\\Desktop\\zo2ys\\functions\\_middleware.js"

export const routes = [
    {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___js_onRequest],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]