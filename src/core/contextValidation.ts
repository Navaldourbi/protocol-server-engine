export const contextValidation = (session: any, context: any) => {
  context = {
    bap_id: "fis-buyer-staging.ondc.org",
    bpp_id: "pramaan.ondc.org/beta/staging/mock/seller",
    bpp_uri: "https://pramaan.ondc.org/beta/staging/mock/seller",
    location: {
      country: {
        code: "IND",
      },
      city: {
        code: "*",
      },
    },
    transaction_id: "495f4a97-9e12-43dd-acc2-7e61a72f202f",
    message_id: "08e4fb14-01c2-4445-8700-3652dc54324b",
    timestamp: "2024-06-28T04:17:54.772Z",
    domain: "ONDC:FIS12",
    version: "2.1.0",
    ttl: "PT10M",
    action: "on_status",
    bap_uri: "https://4c16-59-145-217-117.ngrok-free.app/ondc",
  };

  session = {
    allMessageIds: ["08e4fb14-01c2-4445-8700-3652dc54324b"],
    lastTimestamp: new Date().toISOString(),
  };

  const SERVER_TYPE = process.env.SERVER_TYPE;
  const SUBSCRIBER_ID = process.env.SUBSCRIBER_ID;
  const SUBSCRIBER_URL = process.env.SUBSCRIBER_URL;
  const action = context.action;

  const errors: any = [];

  try {
    Object.entries(context).forEach((item: any) => {
      const [key, value] = item;

      switch (key) {
        case "bap_id":
          if (
            (action !== "search" || action !== "on_search") &&
            ((SERVER_TYPE === "BAP" && value !== SUBSCRIBER_ID) ||
              (SERVER_TYPE === "BPP" && value !== session.bap_id))
          ) {
            errors.push(
              `bap_id should be equal to ${
                SERVER_TYPE === "BAP" ? SUBSCRIBER_ID : session.bap_id
              }`
            );
          }
          return;
        case "bap_uri":
          if (
            (action !== "search" || action !== "on_search") &&
            ((SERVER_TYPE === "BAP" && value !== SUBSCRIBER_URL) ||
              (SERVER_TYPE === "BPP" && value !== session.bap_uri))
          ) {
            errors.push(
              `bap_uri should be equal to ${
                SERVER_TYPE === "BAP" ? SUBSCRIBER_URL : session.bap_uri
              }`
            );
          }
          return;
        case "bpp_id":
          if (
            (action !== "search" || action !== "on_search") &&
            ((SERVER_TYPE === "BPP" && value !== SUBSCRIBER_ID) ||
              (SERVER_TYPE === "BAP" && value !== session.bpp_id))
          ) {
            errors.push(
              `bpp_id should be equal to ${
                SERVER_TYPE === "BPP" ? SUBSCRIBER_ID : session.bap_id
              }`
            );
          }
          return;
        case "bpp_uri":
          if (
            (action !== "search" || action !== "on_search") &&
            ((SERVER_TYPE === "BPP" && value !== SUBSCRIBER_URL) ||
              (SERVER_TYPE === "BAP" && value !== session.bpp_uri))
          ) {
            errors.push(
              `bpp_uri should be equal to ${
                SERVER_TYPE === "BPP" ? SUBSCRIBER_URL : session.bap_uri
              }`
            );
          }
          return;
        case "location":
          if (!value?.country?.code || value.country.code !== session.country) {
            errors.push(
              `location.country.code should be equal to ${session.country}`
            );
          }
          if (!value?.city?.code || value.city.code !== session.cityCode) {
            errors.push(
              `location.city.code should be equal to ${session.country}`
            );
          }
          return;
        case "transaction_id":
          return;
        case "message_id":
          if (session.allMessageIds.includes(value)) {
            errors.push(
              `${value} already used as a message_id in previous transaction.`
            );
          }
          session.allMessageIds.push(value);
          return;
        case "timestamp":
          if (
            session?.lastTimestamp &&
            new Date(value) < new Date(session.lastTimestamp)
          ) {
            errors.push(
              `timestamp should be greater then last call. current call: ${value}, last call: ${session.lastTimestamp}`
            );
          }

          session.lastTimestamp = value;
          return;
        case "domain":
          if (value !== session.domain) {
            errors.push(`doamin should be equal to ${session.domain}`);
          }
          return;
        case "version":
          if (value !== session.version) {
            errors.push(`doamin should be equal to ${session.version}`);
          }
          return;
        case "ttl":
          if (value !== session.ttl) {
            errors.push(`doamin should be equal to ${session.ttl}`);
          }
          return;
        case "action":
          return;
        default:
          errors.push(`Additional field found in context: ${key}`);
      }
    });

    console.log("Errors: ", errors);
  } catch (e) {
    console.log("error", e);
  }
};
