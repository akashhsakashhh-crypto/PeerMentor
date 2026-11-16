const mongoose = require("mongoose");
const dns = require("dns");

async function connectDB() {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);

    const records = await dns.promises.resolveSrv(
      "_mongodb._tcp.peermentorcluster.u4zi239.mongodb.net"
    );

    console.log("MongoDB DNS records resolved:", records.length);

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log("MongoDB Atlas connected successfully!");
  } catch (error) {
    console.log("Connection error:", error.message);

    if (error.reason && error.reason.servers) {
      for (const [address, server] of error.reason.servers) {
        console.log("\nServer:", address);
        console.log("Server type:", server.type);
        console.log("Detailed error:", server.error?.message || "No detailed error");
      }
    }

    process.exit(1);
  }
}

module.exports = connectDB;