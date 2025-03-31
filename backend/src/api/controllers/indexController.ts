import { Request, Response } from "express";
import asyncHandler from 'express-async-handler'

interface EndpointMap {
    locations: string;
    [key: string]: string
}

const welcome = asyncHandler(async (req: Request, res: Response) => {
    res.json({
        message: "Welcome to BoulderPoint API",
        endpoints: {
            locations: '/locations'
        } as EndpointMap
    })
})

export const indexController = {
    welcome
}