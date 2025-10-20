import { IsString, IsNotEmpty } from 'class-validator';

export class ChatbotRequestDto {
  @IsString()
  @IsNotEmpty()
  question: string;
}

export class ChatbotResponseDto {
  @IsString()
  answer: string;
}
