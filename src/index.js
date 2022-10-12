const { MongoClient } = require("mongodb");

let client;
let db;
let faturasCollection;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function faturarTransacaoAtual(transacao) {
  const session = client.startSession();

  await session.withTransaction(async () => {
    const fatura = await faturasCollection.findOne({});

    fatura.total += transacao.valor;

    await sleep(10 * Math.random());

    await faturasCollection.updateOne(
      { _id: fatura._id },
      { $set: { total: fatura.total } }
    );
  });

  await session.endSession();
}

async function faturarTransacaoNovo(transacao) {
  const session = client.startSession();

  await session.withTransaction(async () => {
    const fatura = await faturasCollection.findOne({});

    await sleep(10 * Math.random());

    await faturasCollection.updateOne(
      { _id: fatura._id },
      { $inc: { total: transacao.valor } }
    );
  });

  await session.endSession();
}

(async () => {
  client = await MongoClient.connect("mongodb://localhost:27017");
  db = client.db("teste");
  faturasCollection = db.collection("fatura");

  await faturasCollection.deleteMany({});

  const fatura = { total: 100 };

  await faturasCollection.insertOne(fatura);

  const registroFaturaAntes = await faturasCollection.findOne({});

  console.log({ registroFaturaAntes });

  const transacao1 = { valor: 125 };
  const transacao2 = { valor: 225 };

  await Promise.all([
    faturarTransacaoAtual(transacao1),
    faturarTransacaoAtual(transacao2),
  ]);

  const registroFaturaDepois = await faturasCollection.findOne({});

  console.log({ registroFaturaDepois });

  client.close();
})();
