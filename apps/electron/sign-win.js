"use strict";

exports.default = async function (configuration) {
  if (configuration.path) {
    const alias = "key_1256627685";
    require("child_process").execSync(
      `smctl sign --keypair-alias=${alias} --input "${String(configuration.path)}"`,
    );
  }
};
