// src/graphql/graphql.module.ts

import { Module } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { UserResolver } from './resolvers/user.resolver';
import { TokenResolver } from './resolvers/token.resolver';
import { GraphQLResolver } from './resolvers/graphql.resolver';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    NestGraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: 'schema.graphql',
      }),
  ],
  providers: [UserResolver, TokenResolver, GraphQLResolver],
})
export class GraphQLModule {}
