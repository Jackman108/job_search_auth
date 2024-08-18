// src/graphql/resolver/user.resolver.ts

import { Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { UserObject } from './object-type';
import { User } from '@prisma/client';

@Resolver()
export class UserResolver {
  constructor(private readonly prismaService: PrismaService) {}

  @Query(() => [UserObject])
  async users(): Promise<User[]> {
    return this.prismaService.user.findMany();
  }
}
