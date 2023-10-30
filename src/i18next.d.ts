import "i18next";
// import all namespaces (for the default language, only)
import type common from "../public/locales/en/common.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    returnNull: false;
    resources: {
      common: typeof common;
    };
  }
}
