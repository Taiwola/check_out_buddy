import { IOrder } from "../model/order.model";
import {OrderService, UserService} from "../services";
import {Request, Response} from "express";
import { Items } from "../types";


export class OrderController {
    private orderService: OrderService;
    private userService: UserService;

    constructor() {
        this.orderService = new OrderService();
        this.userService = new UserService();
    }

      /**
     * Transforms a single order object by removing unwanted fields
     * and transforming the items array to include an id field instead of _id.
     * 
     * @param {IOrder} order - The order object to transform.
     * @returns {Promise<any>} - The transformed order object.
     */
    private async transformOrder(order: IOrder): Promise<any> {
        const { __v, items, ...rest } = order.toObject();
    
        const item:Items[] = order.items;

        const transformedItems = item.map((i) => {
            const { _id, ...rest } = i;

            return {
                id: i._id,
                name: i.name,
                barcode: i.barcode,
                image: i.image,
                quantity: i.quantity,
                price: i.price
            }
        })
    
        return {  
            items: transformedItems,
            ...rest, 
        };
    }

    /**
     * Transforms an array of order objects by removing unwanted fields
     * and transforming the items array for each order to include an id field instead of _id.
     * 
     * @param {IOrder[]} orders - The array of order objects to transform.
     * @returns {Promise<any[]>} - The array of transformed order objects.
     */
    private async transformOrders(orders: IOrder[]): Promise<any[]> {
        const transformedOrders = orders.map((order) => {
            const { __v, items, ...rest } = order.toObject();
    
     
            const item:Items[] = order.items;
            const transformedItems = item.map((i) => {
                const { _id, ...rest } = i;
    
                return {
                    id: i._id,
                    name: i.name,
                    barcode: i.barcode,
                    image: i.image,
                    quantity: i.quantity,
                    price: i.price
                }
            })
    
      
            return { 
                items: transformedItems,  
                ...rest, 
            };
        });
    
        return transformedOrders;
    }
    

    /**
     * Creates a new order based on the request body and the logged-in user.
     * If the user is a guest, it returns a success message without creating an order.
     * 
     * @param {Request} req - The request object containing order data.
     * @param {Response} res - The response object.
     * @returns {Promise<Response>} - The response with the created order or an error message.
     */
    async createOrder(req: Request, res: Response): Promise<Response> {
        try {
            const {
                items,
                totalAmount,
                currency,
                paymentIntentId,
                paymentStatus
            }: IOrder = req.body;

            const user = req.user;

            if (user && user.role === 'guest') {
                return res.status(200).json({message: "Request was successfull", data: {}, success: true});
            }

            const options: Partial<IOrder> = {
                userId: user?.id,
                items,
                totalAmount,
                currency,
                paymentIntentId,
                paymentStatus
            }
            
            const order = await this.orderService.createOrder(options);
            const transformOrder = await this.transformOrder(order);
            
            return res.status(201).json({message: "Request was successful", data: transformOrder, success: true});
        } catch (error) {
            console.error("Error in creating orders: ", error );
            return res.status(500).json({data: {message: "internal server error"}, status: 500});
        }
    }

    async getAllOrders(req: Request, res: Response) {
        const user = req.user;

        let orders: IOrder[] = [];

        if (user && user.role !== 'guest') {
            const allOrders = await this.orderService.getAllOrders(user.id);
            orders = await this.transformOrders(allOrders);
        }
        
        return res.status(200).json({message: "Request was successfull", data: orders, success: true});
    }

      /**
     * Fetches all orders for the logged-in user. If the user is a guest, it returns an empty array.
     * 
     * @param {Request} req - The request object containing user information.
     * @param {Response} res - The response object.
     * @returns {Promise<Response>} - The response with all orders or an empty array.
     */
    async getOneOrder(req: Request, res: Response): Promise<Response> {
        const { orderId } = req.params;
        const user = req.user;
    
        try {
            if (user && user.role === 'guest') {
                return res.status(200).json({
                    message: "Request successfull",
                    data: {},
                    success: true
                });
            }
    
            const order = await this.orderService.getOrderById(orderId);
    
            if (!order) {
                return res.status(404).json({
                   data: { message: "Order not found"},
                    status: 404
                });
            }

            const transformedOrder:IOrder = await this.transformOrder(order);
    
            // Return the order details
            return res.status(200).json({
                message: "Request was successful",
                data: transformedOrder,
                success: true
            });
        } catch (error) {
            console.error("Error fetching order: ", error);
            return res.status(500).json({
                data: {message: "Internal server error"},
                status: 500
            });
        }
    }
    

      /**
     * Fetches a single order by its ID for the logged-in user. If the user is a guest, it returns an empty object.
     * 
     * @param {Request} req - The request object containing the order ID.
     * @param {Response} res - The response object.
     * @returns {Promise<Response>} - The response with the order details or an error message.
     */
    async deleteOrders(req: Request, res: Response): Promise<Response> {
        const {orderId} = req.params;
        const user = req.user;

        if (user && user.role === 'guest') return res.status(403).json({
            data:{message: "Access denied for guest users"},
            success: false,
            status:403
        });
        const order = await this.orderService.getOrderById(orderId);
        if (!order) return res.status(404).json({data: {message: "Order not found"}, status: 404});
        try {
            await this.orderService.deleteOrder(orderId);
            return res.status(200).json({message: "Request was successfull", success: true});
        } catch (error) {
            console.error("Error deleting order: ", error);
            return res.status(500).json({
                data: {message: "Internal server error"},
                status: 500
            });
        }
    }
}