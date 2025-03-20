import { Model, RootFilterQuery, Document } from 'mongoose';
import { PaginatedResult } from './pagination.dto';



export class GenericService<T extends Document, I, U> {
  constructor(private readonly model: Model<T>) {}

  async create(createDto: I): Promise<T> {
    const createdItem = new this.model(createDto);
    return await createdItem.save();
  }

  // Método para traer todos sin paginación
  async findAll(filters?: U): Promise<T[]> {
    const docs = await this.model
      .find(filters as unknown as RootFilterQuery<T>)
      .lean()
      .exec();
    return docs as unknown as T[];
  }

  // Método paginado que devuelve también metadata
  async findAllPaginated(filters: U, page = 1, limit = 20): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * limit;
    
    // Traemos la data con .lean() para mayor performance
    const data = await this.model
      .find(filters as unknown as RootFilterQuery<T>)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
      
    // Obtenemos el total de documentos que cumplen el filtro
    const total = await this.model.countDocuments(filters as unknown as RootFilterQuery<T>);
    const totalPages = Math.ceil(total / limit);

    return {
      data: data as unknown as T[],
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    };
  }

  async findOne(id: string): Promise<T | null> {
    const doc = await this.model.findById(id).lean().exec();
    return doc as unknown as T | null;
  }

  async update(id: string, updateDto: U): Promise<T | null> {
    const doc = await this.model.findByIdAndUpdate(id, updateDto, { new: true }).lean().exec();
    return doc as unknown as T | null;
  }

  async remove(id: string): Promise<T | null> {
    const doc = await this.model.findByIdAndDelete(id).lean().exec();
    return doc as unknown as T | null;
  }

  async filter(filters: Partial<Record<keyof T, any>>): Promise<T[]> {
    const docs = await this.model
      .find(filters as unknown as RootFilterQuery<T>)
      .lean()
      .exec();
    return docs as unknown as T[];
  }

  async createBulk(createDtos: I[]): Promise<T[]> {
    const createdItems = await this.model.insertMany(createDtos as any[]);
    return createdItems;
  }
}
