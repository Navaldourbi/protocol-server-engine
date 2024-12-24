import { v4 as uuidv4 } from "uuid";
import ondc from "ondc-payload-module";
const logger = require("../utils/logger").init();
const SERVER_TYPE  = process.env.SERVER_TYPE

type Config = {
  type?: string;
  value?: any;
  check?: string;
  commanData?: Record<string, string>[];
  path?: string;
};

const buildTags = (tags: any) => {
  return Object.keys(tags).map((key) => {
    const subObject = tags[key];

    let display =
      subObject["display"] === undefined
        ? {}
        : { display: subObject["display"] };
    delete subObject["display"];
    const list = Object.keys(subObject).map((subKey) => {
      const value = subObject[subKey];
      return {
        descriptor: {
          code: subKey,
        },
        value: typeof value === "string" ? value : value.toString(),
      };
    });

    return {
      descriptor: {
        code: key,
      },
      ...display,
      list: list,
    };
  });
};

const buildContext = (session: any, action: any) => {
  console.log("buiding context");
  const contextConfig_buyer = [
    {
      beckn_key: "bap_id",
      value: "session.bap_id",
    },
    {
      beckn_key: "bap_uri",
      value: "session.bap_uri",
    },
    {
      beckn_key: "bpp_id",
      value: "session.bpp_id",
    },
    {
      beckn_key: "bpp_uri",
      value: "session.bpp_uri",
    },
    {
      beckn_key: "location.country.code",
      value: "session.country",
    },
    {
      beckn_key: "location.city.code",
      value: "session.cityCode",
    },
    {
      beckn_key: "transaction_id",
      value: "session.currentTransactionId",
    },
    {
      beckn_key: "message_id",
      value: "uuidv4()",
    },
    {
      beckn_key: "timestamp",
      value: "new Date().toISOString()",
    },
    {
      beckn_key: "domain",
      value: "session.domain",
    },
    {
      beckn_key: "version",
      value: "session.version",
    },
    {
      beckn_key: "ttl",
      value: "session.ttl",
    },
    {
      beckn_key: "action",
      value: "action",
    },
  ];

  const contextConfig_seller = [
    {
      beckn_key: "bap_id",
      value: "session.bap_id",
    },
    {
      beckn_key: "bap_uri",
      value: "session.bap_uri",
    },
    {
      beckn_key: "bpp_id",
      value: "session.bpp_id",
    },
    {
      beckn_key: "bpp_uri",
      value: "session.bpp_uri",
    },
    {
      beckn_key: "location.country.code",
      value: "session.country",
    },
    {
      beckn_key: "location.city.code",
      value: "session.cityCode",
    },
    {
      beckn_key: "transaction_id",
      value: "session.currentTransactionId",
    },
    {
      beckn_key: "message_id",
      value: "session.message_id",
    },
    {
      beckn_key: "timestamp",
      value: "new Date().toISOString()",
    },
    {
      beckn_key: "domain",
      value: "session.domain",
    },
    {
      beckn_key: "version",
      value: "session.version",
    },
    {
      beckn_key: "ttl",
      value: "session.ttl",
    },
    {
      beckn_key: "action",
      value: "action",
    },
  ];
  const context = {};
  const contextConfig = SERVER_TYPE === "BPP" ? contextConfig_seller : contextConfig_buyer
  contextConfig.map((item) => {
    try {
      // if (eval(item.value))
      createNestedField(context, item.beckn_key, eval(item.value));
    } catch (err) {
      logger.info(
        item.value +
          eval(item.value) +
          " is undefined, will not be mapping that"
      );
    }
  });
  console.log("context", context);
  return context;
};

const createNestedField = (obj: any, path: any, value: any) => {
  const keys = path.split(".");
  let currentObj = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const isArrayIndex = /\[\d+\]/.test(key); // Check if the key represents an array index

    if (isArrayIndex) {
      const arrayKey = key.substring(0, key.indexOf("["));
      const index = parseInt(key.match(/\[(\d+)\]/)[1], 10);

      if (!currentObj[arrayKey]) {
        currentObj[arrayKey] = [];
      }

      if (!currentObj[arrayKey][index]) {
        currentObj[arrayKey][index] = {};
      }

      currentObj = currentObj[arrayKey][index];
    } else {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
  }

  currentObj[keys[keys.length - 1]] = value;
};

const createPayload = (
  config: any,
  action: any,
  data: any,
  session: any,
  ondc: any
) => {
  const payload = {};
  const startPoint = "START";
  const endPoint = "END";
  const cancelName = "Ride Cancellation";
  const successStatus = "SUCCESS";
  const fulfillmentText = "fulfillment";
  const messageId = uuidv4();
  const paymentId = uuidv4();
  const timestamp = new Date().toISOString();
  const newTranscationId = uuidv4();

  config.map((item: any) => {
    try {
      if (eval(item.value) && (item.check ? eval(item.check) : true))
        createNestedField(
          payload,
          item.beckn_key,
          item.compute ? eval(item.compute) : eval(item.value)
        );
    } catch (err) {
      console.log("error", err);
      logger.info(item.value + " is undefined, will not be mapping that");
    }
  });

  return payload;
};

const constructValueObject = (data: string, key = "business_key") => {
  const dataArray = data.split(",").map((val) => val.trim());
  let objArray: Record<string, string>[] = [];

  dataArray.forEach((item) => {
    const obj: Record<string, string> = {};
    const itemArray = item.split(":").map((val) => val.trim());
    obj[key] = itemArray[0];
    const value = "obj." + itemArray[1];
    obj["value"] = value.split(".").join("?.");
    objArray.push(obj);
  });

  return objArray;
};

const constructPath = (data: string) => {
  if (data.startsWith(".")) {
    data = data.substring(1, data.length);
  }

  data = "obj." + data;
  return data.split(".").join("?.");
};

const decodeInputString = (input: string) => {
  const tokens = input
    .split(/([\[\]\{\}])/)
    .filter((token) => token.trim() !== "");

  if (input.split(".")[0] === "session") {
    return tokens[0].split(".").join("?.");
  }

  if (tokens.length === 1) {
    return "obj?." + tokens[0].split(".").join("?.");
  }

  let i = 0;
  let initalConfig: Config = {};
  let currentConfig = initalConfig;
  let lastTokenSquareBracket = false;
  let lastTokenCurlyBracket = false;
  while (i < tokens.length) {
    if (lastTokenSquareBracket) {
      if (tokens[i] === "]") {
        currentConfig.type = "Array";
        lastTokenSquareBracket = false;

        if (tokens[i + 1] !== "{") {
          currentConfig.value = {};
          currentConfig = currentConfig.value;
        }
      } else {
        currentConfig.check =
          "_?." + tokens[i].substring(2, tokens[i].length - 1);
      }
    } else if (lastTokenCurlyBracket) {
      if (tokens[i] === "}") {
        if (i === tokens.length - 1) {
          if (!currentConfig.value) {
            currentConfig.value = {};
          }
          currentConfig.value.type = "Object";
          currentConfig.value.value = constructValueObject(
            tokens[i - 1],
            "key"
          );
          currentConfig = currentConfig.value;
        } else {
          currentConfig.commanData = constructValueObject(tokens[i - 1]);
          currentConfig.value = {};
          currentConfig = currentConfig.value;
        }
        lastTokenCurlyBracket = false;
      }
    } else if (tokens[i] === "[") {
      lastTokenSquareBracket = true;
    } else if (tokens[i] === "{") {
      lastTokenCurlyBracket = true;
    } else if (
      tokens[i] !== "[" ||
      tokens[i] !== "{" ||
      tokens[i] !== "]" ||
      tokens[i] !== "}"
    ) {
      currentConfig.path = constructPath(tokens[i]);
    }
    i += 1;
  }

  return initalConfig;
};

const extractData = (
  obj: Record<string, any>,
  config: Config,
  commData = {}
) => {
  if (config?.commanData?.length) {
    config.commanData.map((item) => {
      createNestedField(
        commData,
        item.business_key,
        typeof item.value === "string"
          ? eval(item.value)
          : extractData(obj, item)
      );
    });
  }

  const item = config.value;
  if (item.type === "Array") {
    const response: any = [];
    eval(item.path)?.some((data: any) => {
      const _ = data;
      if (item.check ? eval(item.check) : true) {
        const result = extractData(data, item, commData);
        if (result) {
          response.push(result);
        }
      }
    });
    return response;
  } else if (item.type === "String") {
    let data: any = {};
    data[`${item.key}`] = eval(item.path);

    return { ...data, ...commData };
  } else if (item.type === "Object") {
    const data: Record<string, any> = {};
    item.value.map((val: any) => {
      if (!eval(val.value)) {
        // console.log(`key ${val.value} not found`);
        // data[val.key] = undefined;
      } else {
        data[val.key] = eval(val.value);
      }
    });
    return { ...data, ...commData };
  }
};

const createBusinessPayload = (myconfig: any, obj: any) => {
  const payload = {};
  try {
    myconfig.map((conf: any) => {
      if (conf.extractionPath) {
        conf = {
          ...conf,
          value: decodeInputString(conf.extractionPath),
        };

        createNestedField(
          payload,
          conf.business_key,
          typeof conf.value === "string"
            ? eval(conf.value)
            : extractData(obj, conf).flat(Infinity)
        );
      }
    });
    return payload;
  } catch (e) {
    logger.info("error while creating bussniss payload", e);
    return payload;
  }
};

export const createBecknObject = (
  session: any,
  type: string,
  data: any,
  config: any
): any => {
  if (config.sessionData) {
    const updatedSession = createPayload(
      config.sessionData,
      type,
      data,
      session,
      ondc
    );

    session = { ...session, ...updatedSession };
  }
  const payload = createPayload(config.mapping, type, data, session, ondc);

  return { payload, session };
};

export const extractBusinessData = (
  type: string,
  payload: Record<string, any>,
  session: any,
  protocol: any
) => {
  if (protocol.sessionData) {
    const parsedSchema = createBusinessPayload(protocol.sessionData, payload);

    console.log("parsedSchaems", parsedSchema);

    session = { ...session, ...parsedSchema };
  }

  const result = createBusinessPayload(protocol.mapping, payload) as any;

  return { result, session };
};

export const extractPath = (path: string, obj: any) => {
  const payload = {};

  try {
    const value = decodeInputString(path);

    createNestedField(
      payload,
      "data",
      typeof value === "string"
        ? eval(value)
        : extractData(obj, { value }).flat(Infinity)
    );

    return payload;
  } catch (e) {
    logger.info("error while creating bussniss payload", e);
    return payload;
  }
};
