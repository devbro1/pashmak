import { loadConfig } from "@/ConfigLoader.mjs";

export default {
  key1: "value1",
  key2: 42,
  key3: {
    nestedKey: true
  },
  import_bad: loadConfig('./imported_config'),
  import1: await loadConfig('./imported_config'),
  databases: await loadConfig('./databases'),
};
