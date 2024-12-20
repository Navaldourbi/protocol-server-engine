import Ajv from "ajv";
const ajv = new Ajv({
  allErrors: true,
  strict: "log",
});
import addFormats from "ajv-formats";
import { formatted_error } from "../utils/utils";

addFormats(ajv);
require("ajv-errors")(ajv);
const logger = require("../utils/logger").init();
import { schemaNack } from "../utils/responses";
// logger = log.init();

export const validateSchema = async (
  payload: Record<string, any>,
  schema: any
) => {
  logger.info(
    `Inside schema validation service for ${payload?.context?.action} api protocol server`
  );
  try {
    const validate = ajv.compile(schema);
    const valid = validate(payload);
    if (!valid) {
      let error_list = validate.errors;
      logger.error(JSON.stringify(formatted_error(error_list)));
      logger.error("Schema validation : FAIL");
      const erroPath = JSON.stringify(formatted_error(error_list));
      return { status: false, message: erroPath };
    } else {
      logger.info("Schema validation : SUCCESS");
      return { status: true };
    }
  } catch (error) {
    logger.error(error);
  }
};

//  module.exports = validateSchema;
