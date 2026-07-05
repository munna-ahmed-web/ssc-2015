import Axios from "axios";

import { API_ROOT_URL } from "config";

import { authRequestInterceptor, authResponseInterceptor } from "./interceptors/authInterceptor";
import { normalizeError } from "./interceptors/errorInterceptor";

const axios = Axios.create({
  baseURL: API_ROOT_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axios.interceptors.request.use(authRequestInterceptor);

// Single response interceptor — splitting into two causes a double-unwrap bug when
// the auth interceptor retries a request (the retried response passes through the
// success handler again, calling .data on already-unwrapped data).
axios.interceptors.response.use(
  (response) => response.data,
  async (error: unknown) => {
    try {
      return await authResponseInterceptor(error, axios);
    } catch (err) {
      throw normalizeError(err);
    }
  },
);

export { axios };
