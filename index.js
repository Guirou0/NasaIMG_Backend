const express = require('express');
const app = express();
//const cors = require('cors');
require('dotenv').config();
const axios = require('axios');
const path = require('path');

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')))
//app.use(cors());

const searchAPI = axios.create({
    baseURL: "https://images-api.nasa.gov"
})

const roverAPI = axios.create({
    baseURL: "https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity"
})

const apdAPI = axios.create({
    baseURL: "https://api.nasa.gov/planetary"
})

function dataFormatada(date){   
    const dateSplit = date.split("-");
    return (dateSplit[2]+"/"+dateSplit[1]+"/"+dateSplit[0])
}


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})


app.get('/api/searchG', (req, res)=>{
    searchAPI.get(`/search?q=${req.query.q.toLowerCase()}&media_type=image`)
    .then((response) => {
        const photos = response.data.collection.items;
        if(photos.length == 0){
            res.status(200).send("NF");
            return ;
        }
            const pesq =  photos.map((photo)=>{
            const date = new Date(photo["data"][0]["date_created"]);
            const formatar = Intl.DateTimeFormat('pt-Br');
            const dateFormatada = formatar.format(date);
            return {
            id: photo["data"][0]["nasa_id"],
            title: photo["data"][0]["title"],
            data: dateFormatada,
            url: photo["links"][0]["href"]
            }})
        res.status(200).json(pesq)
    }).catch((error) => {
            console.log(error);
            res.status(401).send("NF")
    })
})

app.get("/api/roverG", (req, res)=>{
    roverAPI.get(`/photos?earth_date=${req.query.d}&api_key=${process.env.API_KEY}`)
    .then((response)=>{
        const photos = response.data.photos;
        if(photos.length == 0){
            res.status(200).send("NF");
            return ;
        }
        const pesq = photos.map((photo) => {
            return {
                id: photo['id'],
                title: photo['camera']['full_name'],
                data: photo['sol'],
                url: photo['img_src']
            }
        })
        res.status(200).json(pesq);
    }).catch((error) => {
        console.log(error);
        res.status(400).send("NF")
    })
})

app.get("/api/apdG", (req, res) => {
    const url = req.query.sd ? `/apod?start_date=${req.query.sd}&api_key=${process.env.API_KEY}` : `/apod?api_key=${process.env.API_KEY}`;
    apdAPI.get(url)
    .then((response) => {
        if (!Array.isArray(response.data)) {
            const date = response.data.date;
            const dateFormatada = dataFormatada(date);
            const pesq = {
                autor: response.data.copyright,
                data: dateFormatada,
                desc: response.data.explanation,
                title: response.data.title,
                url: response.data.hdurl
            }
            return res.status(200).json(pesq);
        }
        const photos = response.data;
        pesq = photos.map((photo) => {
            const date = photo.date;
            const dateFormatada = dataFormatada(date);
            const pesq = {
                autor: photo.copyright,
                data: dateFormatada,
                desc: photo.explanation,
                title: photo.title,
                url: photo.hdurl
            }
            return pesq;
        })
        return res.status(200).json(pesq);
    })
    .catch((error) => {
        console.log(error);
        return res.status(401).send("NF");
    })
})

app.listen(port, ()=>{
    console.log(`Rodando na porta ${port}`)
})