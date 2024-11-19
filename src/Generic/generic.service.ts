import { Model } from 'mongoose';
import { Document } from 'mongoose';
export class GenericService <T extends Document, I> {
  constructor(private readonly model: Model<T>) {}

  async create(createDto: I): Promise<T> {
    const createdItem = new this.model(createDto);
    return await createdItem.save(); 
  }

  async findAll(): Promise<T[]> {
    return await this.model.find().exec();
  }

  async findOne(id: string): Promise<T | null> {
    return await this.model.findById(id).exec();
  }

  async update(id: string, updateDto: I): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  }

  async remove(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id).exec();
  }
}
