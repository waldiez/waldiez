/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezModelAPIType, WaldiezModelPrice } from "@waldiez/models/Model/types";

/**
 * ModelData
 * @param baseUrl - The base URL of the API
 * @param apiKey - The API key
 * @param apiType - The type of the API
 * @param apiVersion - The version of the API
 * @param temperature - The temperature
 * @param topP - The top P
 * @param maxTokens - The max tokens
 * @param defaultHeaders - The default headers
 * @param price - The price
 */
export class WaldiezModelData {
    baseUrl: string | null;
    apiKey: string | null;
    apiType: WaldiezModelAPIType;
    apiVersion: string | null;
    temperature: number | null;
    topP: number | null;
    maxTokens: number | null;
    defaultHeaders: { [key: string]: string };
    price: WaldiezModelPrice;

    constructor(
        props: {
            baseUrl: string | null;
            apiKey: string | null;
            apiType: WaldiezModelAPIType;
            apiVersion: string | null;
            temperature: number | null;
            topP: number | null;
            maxTokens: number | null;
            defaultHeaders: { [key: string]: string };
            price: WaldiezModelPrice;
        } = {
            baseUrl: null,
            apiKey: null,
            apiType: "openai",
            apiVersion: null,
            temperature: null,
            topP: null,
            maxTokens: null,
            defaultHeaders: {},
            price: {
                promptPricePer1k: null,
                completionTokenPricePer1k: null,
            },
        },
    ) {
        const { baseUrl, apiKey, apiType, apiVersion, temperature, topP, maxTokens, defaultHeaders, price } =
            props;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.apiType = apiType;
        this.apiVersion = apiVersion;
        this.temperature = temperature;
        this.topP = topP;
        this.maxTokens = maxTokens;
        this.defaultHeaders = defaultHeaders;
        this.price = price;
    }
}
