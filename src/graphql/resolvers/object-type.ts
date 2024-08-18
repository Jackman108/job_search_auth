import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class UserObject {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  password?: string;

  @Field({ nullable: true })
  provider?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  roles: string;

  @Field()
  isBlocked: boolean;
}

@ObjectType()
export class TokenObject {
  @Field()
  token: string;

  @Field()
  exp: Date;

  @Field(() => UserObject)
  user: UserObject;

  @Field()
  userAgent: string;
}

@ObjectType()
export class RoleObject {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}
