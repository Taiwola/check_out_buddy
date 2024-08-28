export interface Decoded {
    id: string;
    email: string;
}

export type Scanned = {
    id: string;
    userId: string;
    barcode: string;
    name: string;
    price: string;
    category: string;
    imageUrl: string;
    createdAt: Date;
    updatedAt: Date;
  };


type Product = {
    asin: string;
    barcode: string;
    imageUrl: string;
    category: string;
    name: string;
    price: string;
  };


  interface ProductDetails extends Product {
    weight: string,
    height: string,
    depth: string,
    color: string,
    width: string,
    volume: string,
    product_description: string
  }

  export interface Items {
    name: string;
    image: string;
    price: string;
    barcode: string;
    quantity: number;
    _id: string
  }