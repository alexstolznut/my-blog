import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
    
        const client = await MongoClient.connect("mongodb://localhost:27017", {
          useNewUrlParser: true
        });
    
        const db = client.db("my-blog");

        await operations(db);
    
    
        client.close();
      } catch (error) {
        res.status(500).json({ message: "Error connecting to db", error });
      }

}

app.get("/api/article/:name", async (req, res) => {
    withDB(async(db)=>{
        const name = req.params.name;

        const articleInfo = await db.collection("articles").findOne({ name: name });
    
        res.status(200).json(articleInfo);
    },res)


  
});
app.post("/api/article/:name/upvote", async (req, res) => {
  withDB(async(db)=>{
    const name = req.params.name;
   

    const articleInfo = await db.collection("articles").findOne({ name: name });
    await db.collection("articles").updateOne(
      { name: name },
      {
        $set: {
          upvotes: (articleInfo.upvotes += 1)
        }
      }
    );

    const updatedArticle = await db
      .collection("articles")
      .findOne({ name: name });

    res.status(200).json(articleInfo);
  }, res)
   
});

app.post("/api/article/:name/add-comment", async (req, res) => {
  withDB(async(db)=>{
    const { username, text } = req.body;
    const name = req.params.name;
 

    const articleInfo = await db.collection("articles").findOne({ name: name });
    
    await db.collection("articles").update({name:name},{
        '$set':{
            comments: articleInfo.comments.concat({username, text})
        }
    });

    
    res.status(200).json(articleInfo);
  }, res)
    

  //res.send(`${name} added comment: ${articleInfo[name].comments.map(comments=> '\n' + comments.toString().replace(new RegExp(',','g'), ' '))}`)
});

app.get('*', (req, res)=>{
  res.sendFile(path.join(__dirname + '/build/index.html'));
})
app.listen(8000, () => console.log("listening on port 8000"));
