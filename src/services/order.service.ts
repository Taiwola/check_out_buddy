import Order, { IOrder } from "../model/order.model";

export class OrderService {

    // Method to create a new order
    async createOrder(data: Partial<IOrder>): Promise<IOrder> {
        // Create and save a new Order document with the provided data
        const order = await Order.create({
            ...data
        });

        // Return the newly created Order document
        return order;
    }

    // Method to retrieve all orders, optionally filtered by user ID
    async getAllOrders(userId?: string): Promise<IOrder[]> {
        // Find all Order documents, optionally filtered by user ID
        return await Order.find({ userId }).exec(); // Execute the query
    }

    // Method to retrieve a single order by its ID
    async getOrderById(orderId: string): Promise<IOrder | null> {
        // Find a single Order document by its unique ID
        return await Order.findById(orderId); // Execute the query
    }

    // Method to update the status or other details of an order by its ID
    async updateOrderStatus(orderId: string, data: Partial<IOrder>): Promise<IOrder | null> {
        // Find an Order document by its ID and update it with the provided data
        return await Order.findByIdAndUpdate(orderId, { ...data }, { new: true });
    }

    // Method to delete an order by its ID
    async deleteOrder(orderId: string): Promise<IOrder | null> {
        // Find and delete an Order document by its unique ID
        return await Order.findByIdAndDelete(orderId); // Execute the query
    }
}
