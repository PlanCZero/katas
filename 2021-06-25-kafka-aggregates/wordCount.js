"use strict";

//wordCount.js
const { Kafka } = require("kafkajs");
const { KafkaStreams } = require("kafka-streams");
const { nativeConfig: config } = require("./config.js");
const {
  SchemaRegistry,
  SchemaType,
} = require("@kafkajs/confluent-schema-registry");
const { generateUser, generatePost } = require("./test-data");

const userSchema = {
  type: "record",
  name: "User",
  namespace: "examples",
  fields: [
    { type: "int", name: "id" },
    { type: "string", name: "name" },
  ],
};

// const userSchema = {
//   type: "record",
//   name: "User",
//   namespace: "examples",
//   fields: [
//     { type: "int", name: "id" },
//     { type: "string", name: "name" },
//   ],
// };

// publishTestRecords({
//   generateEntity: generateUser,
//   schema: userSchema,
//   topic: "users",
// });

const main = async () => {
  const registry = new SchemaRegistry({ host: "http://localhost:8081" });
  const { id } = await registry.register({
    type: SchemaType.AVRO,
    schema: JSON.stringify(userSchema),
  });

  const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092"],
  });

  const producer = kafka.producer();
  await producer.connect();
  const payload = generateUser();
  const encodedValue = await registry.encode(id, payload);
  await producer.send({
    topic: "users",
    messages: [{ value: encodedValue }],
  });
};

const keyMapperEtl = (kafkaMessage) => {
  const value = kafkaMessage.value.toString("utf8");
  console.log("message : " + value);
  const elements = value.toLowerCase().split(" ");
  console.log(elements[0]);

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

  return {
    //someField: elements[0],
    message: [{ value: elements[0] }],
  };
};

const kafkaStreams = new KafkaStreams(config);

kafkaStreams.on("error", (error) => {
  console.log("Error occured:", error.message);
});

const stream = kafkaStreams.getKStream();

//input-topicから取得したデータを
//キー毎にカウントしてoutput-topicに送る（count >= 3のキー）
stream.from("posts").map(keyMapperEtl)
// .countByKey("someField", "count")
//   .filter((kv) => kv.count >= 3)
//   .map((kv) => 'test streams')
//   .tap((kv) => console.log(kv))
// .mapJSONConvenience()
// .mapWrapKafkaValue()
 .tap((j)=>console.log(j)) 
 .wrapAsKafkaValue()
.to("users");

Promise.all([stream.start()]).then(() => {
  console.log("started..");
  // 50秒したらStreamをclose
  setTimeout(() => {
    kafkaStreams.closeAll();
    console.log("stopped..");
  }, 50000);
});

// main().catch((e) => {
//   console.error(e);
//   process.exit(1);
// });
