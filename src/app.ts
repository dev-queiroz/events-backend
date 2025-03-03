import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";

// Lista de funções Lambda a serem empacotadas
const lambdaFunctions = [
  "auth/register",
  "auth/login",
  "auth/forgotPassword",
  "auth/resetPassword",
  "event/createEvent",
  "event/getEvents",
  "event/getEventById",
  "event/updateEvent",
  "event/deleteEvent",
  "ticket/createTicketType",
  "ticket/getTicketTypes",
  "ticket/updateTicketType",
  "ticket/deleteTicketType",
  "reservation/createReservation",
  "reservation/getReservations",
  "reservation/getReservationById",
  "reservation/cancelReservation",
  "payment/createPayment",
  "payment/processPayment",
  "payment/getPaymentById",
  "organizer/getDashboard",
  "organizer/getEvents",
];

// Função para compilar e empacotar
const buildAndPackage = () => {
  console.log("Building TypeScript files...");
  execSync("npx tsc", { stdio: "inherit" });

  const distDir = path.resolve(__dirname, "../dist");
  const lambdaDir = path.join(distDir, "lambda");

  lambdaFunctions.forEach((func) => {
    const funcPath = path.join(lambdaDir, `${func}.js`);
    const zipPath = path.join(distDir, `${func.replace("/", "-")}.zip`);

    if (fs.existsSync(funcPath)) {
      console.log(`Packaging ${func}...`);

      // Criar um arquivo ZIP usando archiver
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        console.log(
          `${func} packaged successfully: ${archive.pointer()} bytes`
        );
      });

      archive.on("error", (err: any) => {
        throw err;
      });

      archive.pipe(output);
      archive.file(funcPath, { name: `${func.split("/").pop()}.js` });
      archive.finalize();
    } else {
      console.warn(`Function ${func} not found at ${funcPath}`);
    }
  });

  console.log("Build and packaging complete.");
};

// Executar o build e empacotamento
buildAndPackage();
