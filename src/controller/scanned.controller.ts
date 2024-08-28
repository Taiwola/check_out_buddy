import { Request, Response } from "express";
import { ScannedHistoryService, UserService } from "../services";
import { IScannedHistory } from "../model/scannedHistory.model";
import axios from "axios";
import { v4 as uuid } from "uuid";

// Google Places API URL for finding nearby stores
const GOOGLE_PLACES_API_URL =
  "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

  // Type definition for a product
type Product = {
  asin: string;
  barcode: string;
  imageUrl: string;
  category: string;
  name: string;
  price: string;
  scannedId?: string;
};

export class ScannedController {
  private scannedHistoryService: ScannedHistoryService;
  private userService: UserService;

  constructor() {
    this.scannedHistoryService = new ScannedHistoryService();
    this.userService = new UserService();
  }

  // Transform scanned history data for consistent response formatting
  private transformScannedHistory(scanHistory: IScannedHistory[]) {
    const transformedScannedHistory: IScannedHistory[] = scanHistory.map(
      (scanHistory) => {
        const { _id, __v, ...rest } = scanHistory.toObject();
        return { id: scanHistory._id, ...rest };
      }
    );
    return transformedScannedHistory;
  }

   // Transform a single scanned history record for consistent response formatting
  private transformScanned(scanned: IScannedHistory) {
    const { _id, __v, ...rest } = scanned.toObject();
    return { id: scanned._id, ...rest };
  }

   // Method to scan a barcode and retrieve product information
  async scanBarCode(req: Request, res: Response) {
    const { barcode } = req.body; // Latitude and longitude for location-based search
    const user = req.user;

    try {
      // Fetch product information from the Open Food Facts API
      const url = `https://world.openfoodfacts.net/api/v2/product/${barcode}`;

      const product: any = await axios.get(url);

      const productName = product.data.product.product_name;

       // Fetch product pricing information from the RapidAPI Amazon data API
      const options = {
        method: "GET",
        url: "https://real-time-amazon-data.p.rapidapi.com/search?",
        params: {
          query: productName,
          page: "1",
          country: "GB",
          sort_by: "RELEVANCE",
          product_condition: "ALL",
          is_prime: "false",
        },
        headers: {
          "x-rapidapi-key":
            process.env.X_RAPID_API_KEY as string,
          "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
        },
      };

      const response = await axios.request(options);

      const products = response.data.data.products[0];

        // If the product is not found, return a 404 response
      if (!products) {
        return res
          .status(404)
          .json({ data: { message: `${productName} not found` }, status: 404 });
      }

       // Prepare the scanned product data
      const scanned = {
        id: "",
        userId: "",
        barcode,
        name: productName,
        price: products.product_minimum_offer_price,
        category: product.data.product.categories || "Uncategorized",
        imageUrl: products.product_photo,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

       // If the user is not logged in or is a guest, return the scanned data without saving it
      if (!user || !user.id || user.role === "guest") {
        return res
          .status(200)
          .json({ message: "success", success: true, data: scanned });
      }

      const userExist = await this.userService.findOneUser(user.id);

      if (!userExist) {
        return res
          .status(404)
          .json({ message: "Request failed", success: false });
      }

      // Save the scanned product data to the user's scanned history
      const saveScan: Partial<IScannedHistory> = {
        userId: userExist._id as string,
        name: productName,
        barcode: barcode as string,
        price: products.product_minimum_offer_price,
        category: product.data.product.categories || "Uncategorized",
        imageUrl: products.product_photo,
      };

      const savedHistory = await this.scannedHistoryService.save(saveScan);

      // Prepare the response data with the saved history details
      const data = {
        id: savedHistory._id,
        userId: savedHistory.userId,
        barcode,
        name: productName,
        price: products.product_minimum_offer_price,
        category: product.data.product.categories || "Uncategorized",
        imageUrl: products.product_photo,
        createdAt: savedHistory.createdAt,
        updatedAt: savedHistory.updatedAt,
      };

      res.status(200).json({
        message: "Product retrieved successfully",
        data: data,
        success: true,
      });
    } catch (error) {
       // Handle any errors during the process
      const err = error as any;
      console.error(err?.data?.error);
      res.status(500).json({
        data: { message: "Failed to retrieve product and store information" },
        status: 500,
      });
    }
  }

   // Method to find nearby stores based on location and product name
  async findNearByStores(req: Request, res: Response) {
    try {
      const { lat, lng, productName, price } = req.query;

      // Validate that latitude, longitude, and product name are provided
      if (!lat || !lng || !productName) {
        return res
          .status(400)
          .json({ error: "Latitude and longitude are required" });
      }

      const latitude = lat;
      const longitude = lng;

      const placesUrl = GOOGLE_PLACES_API_URL;

       // Fetch nearby stores using the Google Places API
      const placesResponse = await axios.get(placesUrl, {
        params: {
          location: `${latitude},${longitude}`,
          radius: 30000,
          keyword: productName,
          fields: "photos",
          key: process.env.PLACES_URL_API_KEY as string,
        },
      });

     // Extract store information from the API response
     const stores = placesResponse.data.results as any[];

     // Fetch images and estimated prices for each store
      const promise = stores.map(async (store) => {
        const placeId = store.place_id;

        const imageUrl = await this.getStoreImages(placeId);

        const productPrice = this.generateEstimatedPrice(Number(price));

        return {
          id: uuid(),
          storeName: store.name,
          name: productName,
          imageUrl,
          price: productPrice,
        };
      });

      const result = await Promise.all(promise);

      return res.status(200).json({
        message: "Request was successfull",
        data: result,
        success: false,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ data: { message: "internal server errror" }, status: 500 });
    }
  }

   // Generate an estimated price for a product based on a reference price and variance
  generateEstimatedPrice(referencePrice: number, variancePercentage = 10) {
    // Convert the percentage variance to a decimal (e.g., 10% -> 0.10)
    const varianceFactor = variancePercentage / 100;

    // Calculate the minimum and maximum prices based on the variance
    const minPrice = referencePrice * (1 - varianceFactor);
    const maxPrice = referencePrice * (1 + varianceFactor);

    // Generate a random price within the range
    const estimatedPrice = Math.random() * (maxPrice - minPrice) + minPrice;

    // Return the estimated price, rounded to 2 decimal places
    return estimatedPrice.toFixed(2);
  }

  
   // Fetch store images from the Google Places API using the place ID
  async getStoreImages(placeId: string) {
    const placeDetailsUrl =
      "https://maps.googleapis.com/maps/api/place/details/json";

    const apiKey = process.env.PLACES_URL_API_KEY as string;

    // Step 1: Get place details including photos
    const placeDetailsResponse = await axios.get(placeDetailsUrl, {
      params: {
        place_id: placeId,
        fields: "photos",
        key: apiKey,
      },
    });

    const photos = placeDetailsResponse.data.result.photos;

    if (photos && photos.length > 0) {
      const photoReference = photos[0].photo_reference;

      // Step 2: Construct the photo URL
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${apiKey}`;

      return photoUrl;
    } else {
      return null; // No photos available
    }
  }

   // Method to search for a product by barcode and retrieve product information
  async getBySearchBarcode(req: Request, res: Response) {
    const { barcode } = req.query; // Barcode is passed as a query parameter
    const user = req.user;

    if (!barcode) {
      return res.status(400).json({ error: "Barcode is required" });
    }

    try {
      const url = `https://world.openfoodfacts.net/api/v2/product/${barcode}`;
      const productResponse = await axios.get(url);

      if (!productResponse.data.product) {
        return res
          .status(404)
          .json({ error: "Product not found", success: false });
      }

      const productName = productResponse.data.product.product_name;

      const options = {
        method: "GET",
        url: "https://real-time-amazon-data.p.rapidapi.com/search?",
        params: {
          query: productName,
          page: "1",
          country: "GB",
          sort_by: "RELEVANCE",
          product_condition: "ALL",
          is_prime: "false",
        },
        headers: {
          "x-rapidapi-key":
            process.env.X_RAPID_API_KEY,
          "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
        },
      };

      const response = await axios.request(options);

      const products = response.data.data.products[0];

      if (!products) {
        return res
          .status(404)
          .json({ data: { message: `${productName} not found` }, status: 404 });
      }

      const productRes: Product = {
        asin: products.asin,
        name: productName,
        price: products.product_price,
        barcode: barcode as string,
        category: productResponse.data.product.categories || "Uncategorized",
        imageUrl: products.product_photo,
      };

      // Save scanned history if the user is not a guest
      if (user && user.role !== "guest") {
        const userExist = await this.userService.findOneUser(user.id as string);
        if (!userExist)
          return res
            .status(404)
            .json({ message: "Request failed", success: false });

        const options: Partial<IScannedHistory> = {
          userId: userExist._id as string,
          name: productRes.name,
          barcode: barcode as string,
          price: productRes.price,
          category: productRes.category,
          imageUrl: productRes.imageUrl,
        };

        const savedHistory = await this.scannedHistoryService.save(options);

        productRes.scannedId = savedHistory._id as string;
      }

      res.status(200).json({
        message: "Product retrieved successfully",
        data: productRes,
        success: true,
      });
    } catch (error) {
      console.log(error);

      const err = error as any;
      console.error(err?.data?.error);
      res.status(500).json({
        data: { message: "Failed to retrieve product and store information" },
        status: 500,
      });
    }
  }

  // Get all scanned history 
  async getAllScanned(req: Request, res: Response): Promise<Response> {
    const user = req.user;

    let scanned: IScannedHistory[] = [];

    if (user && user.role !== "guest") {
      scanned = await this.scannedHistoryService.findAllScanned(user.id);
    }

    return res.status(200).json({
      message: "Request was successful",
      data: this.transformScannedHistory(scanned),
      success: true,
    });
  }

  // Get scanned history by userId
  async getScannedByUserId(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user;

      const { userId } = req.params;

      // Check if the user is a guest
      if (user && user.role === "guest") {
        return res.status(200).json({
          message: "Request was successful",
          data: [],
          success: true,
        });
      }

      // Fetch the scanned histories for the given userId
      const scannedHistories = await this.scannedHistoryService.findByUserId(
        userId
      );

      return res.status(200).json({
        message: "Request was successful",
        data: this.transformScannedHistory(scannedHistories),
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        data: {
          message: "Internal server error",
        },
        status: 500,
      });
    }
  }

  // get scanned by barcode - if the only for logged in user
  async getScannedByBarcode(req: Request, res: Response) {
    try {
      const user = req.user;

      const { barcode } = req.params;

      let scanned: IScannedHistory[] = [];

      if (user && user.role !== "guest") {
        scanned = await this.scannedHistoryService.findScannedByBarcode(
          barcode
        );
      }

      return res.status(200).json({
        message: "Request was successful",
        data: scanned,
        success: true,
      });
    } catch (error) {
      console.error("error fetching scanned: " + error);
      return res
        .status(500)
        .json({ data: { message: "Internal server error" }, status: 500 });
    }
  }

  // Get a single scanned history by its ID
  async getScannedById(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user;

      const { id } = req.params;

      // Check if user is not a guest
      if (user && user.role !== "guest") {
        const scanned = await this.scannedHistoryService.findByScannedId(id);
        if (!scanned) {
          return res.status(404).json({
            data: { message: "Scanned history not found" },
            status: 404,
          });
        }
        return res.status(200).json({
          message: "Request was successful",
          data: this.transformScanned(scanned),
          success: true,
        });
      }

      // If user is a guest, return an empty object
      return res.status(200).json({
        message: "Request was successful",
        data: {},
        success: true,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        data: { message: "Failed to get scanned history" },
        status: 500,
      });
    }
  }

  // Delete scanned history by its ID
  async deleteScannedById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deletedScannedHistory = await this.scannedHistoryService.deleteById(
        id
      );
      if (!deletedScannedHistory) {
        return res.status(404).json({
          data: { message: "Scanned history not found" },
          status: 404,
        });
      }
      return res
        .status(200)
        .json({ message: "Scanned history deleted successfully" });
    } catch (error) {
      return res.status(500).json({
        data: { message: "Failed to delete scanned history" },
        status: 500,
      });
    }
  }
}
