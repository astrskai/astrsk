import axios, { AxiosError, AxiosInstance } from "axios";

export type HttpClient = AxiosInstance;

export const httpClient = axios.create({
  timeout: 30000,
});

export const isHttpError = (error: any): error is AxiosError<any, any> => {
  return axios.isAxiosError(error);
};
