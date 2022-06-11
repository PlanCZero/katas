const { Kafka } = require("kafkajs");
const { SchemaRegistry } = require("@kafkajs/confluent-schema-registry");
const { upsertPost, closeDbConnections } = require("./db");
const { updateUserSummary } = require("./user-summary-agg");

const main = async () => {
  const registry = new SchemaRegistry({ host: "http://localhost:8081" });

  const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092"],
  });

  const consumer = kafka.consumer({ groupId: "test-posts-1" });

  await consumer.connect();
  await consumer.subscribe({ topic: "postcount", fromBeginning: true });

  const shutdown = async () => {
    await consumer.disconnect();
    await closeDbConnections();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGHUP", shutdown);

  await consumer.run({
    eachMessage: async ({ message }) => {
      console.log(JSON.stringify(message));
      // const post = await registry.decode(message.value);
      // await upsertPost(post);
      // await updateUserSummary(post.authorId);
      console.log('sssssssssssssssss',post);
    },
  });
};
/* The topic that the stream is writing to. */

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
