import { Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenObject, UserObject } from './object-type'; 
import { Token } from '@prisma/client';

@Resolver()
export class TokenResolver {
  constructor(private readonly prismaService: PrismaService) {}

  @Query(() => [TokenObject]) 
  async tokens(): Promise<Token[]> {
    return this.prismaService.token.findMany();
  }
}
