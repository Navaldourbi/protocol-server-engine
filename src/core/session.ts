import { cache } from "./cache";
import fs from "fs";
import yaml from "yaml";
import path, { dirname } from "path";
import $RefParser from "@apidevtools/json-schema-ref-parser";
import { parseBoolean } from "../utils/utils";
import { configLoader } from "./loadConfig";
const localConfig = parseBoolean(process.env.localConfig);
const SERVER_TYPE = process.env.SERVER_TYPE;

export const insertSession = async (session: any) => {
  await cache.set(session.transaction_id, session, 86400);
};

export const getSession = async (transaction_id: string) => {
  return await cache.get(transaction_id);
};

function loadConfig() {
  if (!SERVER_TYPE) {
    throw new Error("SERVER_TYPE not defined in env variables");
  }
  return new Promise(async (resolve, reject) => {
    try {
      if (localConfig) {
        let config = yaml.parse(
          fs.readFileSync(path.join(__dirname, "../../protocol-server-config/configs/igm.yaml"), "utf8")
        );

        // const schema:any = await $RefParser.dereference("/Users/naval/Desktop/untitled folder 2/protocol-server-engine/protocol-server-config/configs/igm.yaml");//example
        const schema:any = await $RefParser.dereference(path.join(__dirname, "../../protocol-server-config/configs/igm.yaml"));

        // this.config = schema;
        config = schema;
        
        resolve(schema[SERVER_TYPE]);
      } else {
        const build_spec = configLoader.getConfig();

        resolve(build_spec[SERVER_TYPE]);
      }
    } catch (e: any) {
      throw new Error(e);
    }
  });
}

const getConfigBasedOnFlow = async (flowId: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      // this.config = await loadConfig();
      const config = (await loadConfig()) as any;
      let filteredProtocol = null;
      let filteredCalls = null;
      let filteredDomain = null;
      let filteredSessiondata = null;
      let filteredAdditionalFlows = null;
      let filteredsummary = "";
      let filteredSchema = null;
      let filteredApi = null;

      // this.config.flows.forEach((flow) => {
      config.flows.forEach((flow: any) => {
        if (flow.id === flowId) {
          const {
            protocol,
            calls,
            domain,
            sessionData,
            additioalFlows,
            summary,
            schema,
            api,
          } = flow;

          filteredProtocol = protocol;
          filteredCalls = calls;
          filteredDomain = domain;
          filteredSessiondata = sessionData;
          filteredAdditionalFlows = additioalFlows || [];
          filteredsummary = summary;
          (filteredSchema = schema), (filteredApi = api);
        }
      });

      resolve({
        filteredCalls,
        filteredProtocol,
        filteredDomain,
        filteredSessiondata,
        filteredAdditionalFlows,
        filteredsummary,
        filteredSchema,
        filteredApi,
      });
    } catch (err) {
      console.log("error", err);
    }
  });
};

export async function generateSession(session_body: any) {
  return new Promise(async (resolve, reject) => {
    const { country, cityCode, transaction_id, configName } = session_body;

    const {
      filteredCalls,
      filteredProtocol,
      filteredDomain,
      filteredSessiondata,
      filteredAdditionalFlows,
      filteredsummary,
      filteredSchema,
      filteredApi,
    } = (await getConfigBasedOnFlow(configName)) as any;

    const session = {
      ...session_body,
      bap_id: process.env.SUBSCRIBER_ID,
      bap_uri: process.env.callbackUrl,
      ttl: "PT10M",
      domain: filteredDomain,
      summary: filteredsummary,
      ...filteredSessiondata,
      currentTransactionId: transaction_id,
      transactionIds: [transaction_id],
      // protocol: filteredProtocol,
      calls: filteredCalls,
      additioalFlows: filteredAdditionalFlows,
      // schema: filteredSchema,
      api: filteredApi,
    };

    await insertSession(session);
    resolve(true);
  });
}

export const findSession = async (body: any) => {
  try {
    let session = "session";
    const allSessions = await cache.get();
    console.log("allSessions", allSessions);

    for (const ses of allSessions) {
      const sessionData = await getSession(ses);
      console.log("sessionDat", sessionData.transactionIds);
      if (sessionData.transactionIds.includes(body.context.transaction_id)) {
        console.log("<got session>");
        session = sessionData;
        break;
      }
    }

    return session;
  } catch (error) {
    console.error("Error finding session:", error);
    throw error;
  }
};

module.exports = { generateSession, getSession, insertSession, findSession };
