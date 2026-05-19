declare module "nodemailer" {
  const nodemailer: {
    createTransport(config: unknown): {
      sendMail(payload: unknown): Promise<unknown>;
    };
  };

  export default nodemailer;
}
