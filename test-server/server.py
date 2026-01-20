"""
WebSocket 음성 통신 테스트 서버
- 클라이언트로부터 마이크 오디오 수신
- WAV 파일을 청크 단위로 스트리밍 전송
- 텍스트 메시지 (자막, STT, 감정) 전송
"""

import asyncio
import json
import wave
import os
from pathlib import Path
from typing import Optional
import websockets
from websockets.server import WebSocketServerProtocol

# 설정
HOST = "localhost"
PORT = 8765
WAV_FILE = "test_audio.wav"  # 테스트용 WAV 파일
CHUNK_SIZE = 2048  # 한 번에 보낼 프레임 수


class VoiceStreamServer:
    def __init__(self, wav_file: str):
        self.wav_file = wav_file
        self.clients = set()

    async def send_text_message(
        self, websocket: WebSocketServerProtocol, message_type: str, content: dict
    ):
        """텍스트 메시지 전송 (JSON)"""
        message = {"messageType": message_type, "content": content}
        await websocket.send(json.dumps(message))
        print(f"[→ 텍스트] {message_type}: {content}")

    async def stream_wav_file(self, websocket: WebSocketServerProtocol):
        """WAV 파일을 청크 단위로 스트리밍"""
        if not os.path.exists(self.wav_file):
            print(f"[오류] WAV 파일을 찾을 수 없습니다: {self.wav_file}")
            return

        with wave.open(self.wav_file, "rb") as wav:
            channels = wav.getnchannels()
            sample_width = wav.getsampwidth()
            framerate = wav.getframerate()

            print(
                f"[스트리밍 시작] {channels}ch, {sample_width * 8}bit, {framerate}Hz"
            )

            chunk_count = 0
            total_frames = 0
            
            while True:
                # PCM 데이터 읽기 (CHUNK_SIZE = 프레임 수)
                pcm_data = wav.readframes(CHUNK_SIZE)
                
                if not pcm_data:
                    break

                # WAV 헤더 + PCM 데이터
                wav_chunk = self._create_wav_chunk(
                    pcm_data, channels, framerate, sample_width
                )
                
                await websocket.send(wav_chunk)

                chunk_count += 1
                frames_in_chunk = len(pcm_data) // (channels * sample_width)
                total_frames += frames_in_chunk
                
                if chunk_count % 10 == 0:
                    duration = total_frames / framerate
                    print(f"[→ 오디오] 청크 {chunk_count} | {duration:.2f}초 ({frames_in_chunk}프레임)")

            total_duration = total_frames / framerate
            print(f"[스트리밍 완료] {chunk_count}개 청크, {total_duration:.2f}초")

    def _create_wav_chunk(
        self, pcm_data: bytes, channels: int, sample_rate: int, sample_width: int
    ) -> bytes:
        """WAV 청크 생성 (헤더 44바이트 + PCM 데이터)"""
        data_size = len(pcm_data)
        byte_rate = sample_rate * channels * sample_width
        block_align = channels * sample_width

        header = bytearray(44)
        # RIFF 헤더
        header[0:4] = b"RIFF"
        header[4:8] = (36 + data_size).to_bytes(4, "little")
        header[8:12] = b"WAVE"

        # fmt 청크
        header[12:16] = b"fmt "
        header[16:20] = (16).to_bytes(4, "little")
        header[20:22] = (1).to_bytes(2, "little")  # PCM
        header[22:24] = channels.to_bytes(2, "little")
        header[24:28] = sample_rate.to_bytes(4, "little")
        header[28:32] = byte_rate.to_bytes(4, "little")
        header[32:34] = block_align.to_bytes(2, "little")
        header[34:36] = (sample_width * 8).to_bytes(2, "little")

        # data 청크
        header[36:40] = b"data"
        header[40:44] = data_size.to_bytes(4, "little")

        return bytes(header) + pcm_data

    async def handle_client(self, websocket: WebSocketServerProtocol):
        """클라이언트 연결 핸들러"""
        client_id = id(websocket)
        self.clients.add(websocket)
        print(f"[연결] 클라이언트 {client_id}")

        try:
            # 환영 메시지
            await self.send_text_message(
                websocket, "SUBTITLE", {"text": "안녕하세요! 음성 스트리밍 테스트 서버입니다."}
            )

            # 오디오 스트리밍 시작 (백그라운드)
            stream_task = asyncio.create_task(self.stream_wav_file(websocket))

            # 클라이언트로부터 메시지 수신
            async for message in websocket:
                if isinstance(message, bytes):
                    # 마이크 오디오 데이터 수신
                    print(f"[← 오디오] {len(message)} bytes 수신")

                    # STT 시뮬레이션
                    if len(message) > 0:
                        await self.send_text_message(
                            websocket,
                            "USER_STT",
                            {"text": "테스트 음성 입력"},
                        )

                elif isinstance(message, str):
                    # 텍스트 메시지 수신
                    try:
                        data = json.loads(message)
                        print(f"[← 텍스트] {data}")
                    except json.JSONDecodeError:
                        print(f"[← 텍스트] {message}")

            # 스트리밍 태스크 대기
            await stream_task

        except websockets.exceptions.ConnectionClosed:
            print(f"[연결 종료] 클라이언트 {client_id}")
        except Exception as e:
            print(f"[오류] {e}")
        finally:
            self.clients.discard(websocket)

    async def start(self):
        """서버 시작"""
        print(f"[서버 시작] ws://{HOST}:{PORT}")
        print(f"[WAV 파일] {self.wav_file}")
        async with websockets.serve(self.handle_client, HOST, PORT):
            await asyncio.Future()  # 무한 대기


async def main():
    server = VoiceStreamServer(WAV_FILE)
    await server.start()


if __name__ == "__main__":
    print("=" * 50)
    print("WebSocket 음성 스트리밍 테스트 서버")
    print("=" * 50)
    asyncio.run(main())
