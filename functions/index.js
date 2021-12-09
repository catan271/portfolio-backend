import functions from 'firebase-functions'
import { MongoClient } from 'mongodb'
import { config } from 'dotenv'
import express, { json } from 'express'
import cors from 'cors'
import sendgrid from '@sendgrid/mail'

config()
sendgrid.setApiKey(process.env.SENDGRID)
const client = new MongoClient(process.env.MONGODB)
const databaseName = 'portfolio'
const app = express()
app.use(cors())
app.use(json())

app.get('/:collection', async (req, res) => {
    try {
        if (!client.topology?.isConnected()) {
            await client.connect()
        }
        
        const collection = client.db(databaseName).collection(req.params.collection)        
        const cursor = collection.find({})

        const projects = []        
        await cursor.forEach(project => projects.push(project))
        
        res.send(projects)
    } catch (e) {
        res.status(400).send(e)
    }
})

app.post('/', async (req, res) => {
    try {
        const { name, email, content } = req.body

        await sendgrid.send({
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL,
            subject: 'Email from My Portfolio',
            text: `Name: ${name.trim()}\nEmail: ${email.trim()}\nContent:\n${content.trim()}`
        })
        res.send('OK')
    } catch(e) {
        res.status(400).send(e)
    }
})

export const api = functions.https.onRequest(app)