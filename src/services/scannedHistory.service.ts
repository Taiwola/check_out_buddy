import { IScannedHistory, ScannedHistory } from '../model/scannedHistory.model';

export class ScannedHistoryService {
    
    // Method to save scanned history
    async save(scannedHistory: Partial<IScannedHistory>): Promise<IScannedHistory> {
        // Create a new ScannedHistory document with the provided data
        const newScannedHistory = await ScannedHistory.create({
            ...scannedHistory
        });
        // Return the newly created ScannedHistory document
        return newScannedHistory;
    }

    // Method to find scanned history entries by user ID
    async findByUserId(userId: string): Promise<IScannedHistory[]> {
        // Find all ScannedHistory documents associated with the specified user ID
        return await ScannedHistory.find({ userId: userId })
            .sort({ createdAt: -1 }) // Sort by creation date in descending order
            .exec(); // Execute the query
    }

    // Method to find scanned history entries by barcode
    async findScannedByBarcode(barcode: string): Promise<IScannedHistory[]> {
        // Find all ScannedHistory documents with the specified barcode
        return await ScannedHistory.find({ barcode }).exec(); // Execute the query
    }

    // Method to find all scanned history entries, optionally filtered by user ID
    async findAllScanned(userId?: string): Promise<IScannedHistory[]> {
        // Find all ScannedHistory documents, optionally filtered by user ID
        return await ScannedHistory.find({ userId: userId }).exec(); // Execute the query
    }

    // Method to find scanned history entry by its ID
    async findByScannedId(id: string): Promise<IScannedHistory | null> {
        // Find a single ScannedHistory document by its ID
        return await ScannedHistory.findById(id); // Execute the query
    }

    // Method to delete scanned history entry by ID
    async deleteById(id: string): Promise<IScannedHistory | null> {
        // Find and delete a ScannedHistory document by its ID
        return await ScannedHistory.findByIdAndDelete(id).exec(); // Execute the query
    }
}
