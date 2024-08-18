// src/graphql/resolvers/graphql.resolver.ts

import { Resolver } from '@nestjs/graphql';
import { UserResolver } from './user.resolver';
import { TokenResolver } from './token.resolver';

@Resolver()
export class GraphQLResolver {
  constructor(
    private readonly userResolver: UserResolver,
    private readonly tokenResolver: TokenResolver,
  ) {}
}

