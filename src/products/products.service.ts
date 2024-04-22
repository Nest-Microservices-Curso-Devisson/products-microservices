import { 
  HttpStatus,
  Injectable, 
  Logger, 
  OnModuleInit 
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('ProductService');
  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected')
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto
    }) ;
  }

  async findAll( PaginationDto : PaginationDto) {
    const { page, limit } = PaginationDto;
    const totalPages = await this.product.count(
      { where: { available:true } }
    );
    const lastPage = Math.ceil(totalPages/limit);


    return {
      data: await this.product.findMany({
        skip: (page-1) * limit,
        take: limit,
        where:  {
          available: true
        }
      }),
      meta: { 
        total: totalPages,
        page: page,
        lastPage: lastPage,
      }
    }
  }

  async findOne(id: number) {
    const product = await this.product.findUnique({
      where: { 
        id,
        available:true
      },
    });
    
    if (!product) {
      // Puedes lanzar un error, por ejemplo:
      throw new RpcException({
        message: `product with id #${ id } not found`,
        status: HttpStatus.BAD_REQUEST
      });
    }
  
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...data } = updateProductDto;

    await this.findOne(id);
    
    return this.product.update({
      where: {id},
      data: data,
    })
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.product.update({
      where: { id },
      data:{
        available: false
      }
    })
  }
}
