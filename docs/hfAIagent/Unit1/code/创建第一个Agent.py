import requests

class ChatAPI:
    def __init__(self, token=None):
        self.url = "https://api.siliconflow.cn/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {token}" if token else "Bearer <token>",
            "Content-Type": "application/json"
        }
        self.payload = {
            "model": "Qwen/Qwen2-1.5B-Instruct",
            "messages": [],
            "stream": False,
            "max_tokens": 512,
            "stop": ["null"],
            "temperature": 0.7,
            "top_p": 0.7,
            "top_k": 50,
            "frequency_penalty": 0.5,
            "n": 1,
            "response_format": {"type": "text"}
        }

    def set_model(self, model):
        self.payload["model"] = model
        return self

    def add_message(self, role, content):
        self.payload["messages"].append({"role": role, "content": content})
        return self

    def set_stream(self, stream):
        self.payload["stream"] = stream
        return self

    def set_max_tokens(self, max_tokens):
        self.payload["max_tokens"] = max_tokens
        return self

    def set_temperature(self, temperature):
        self.payload["temperature"] = temperature
        return self

    def set_top_p(self, top_p):
        self.payload["top_p"] = top_p
        return self

    def set_stop_sequences(self, stop):
        self.payload["stop"] = stop
        return self

    def send_request(self):
        response = requests.post(
            self.url,
            json=self.payload,
            headers=self.headers
        )
        return response.json()['choices'][0]['message']['content']

# 使用示例
def firstTry():
    # 初始化并设置参数
    chat = ChatAPI("YOUR-APIKEY-HERE") \
        .add_message("system","")\
        .add_message("user", "the capital of france is") \
        .set_max_tokens(512)
    
    # 发送请求并打印结果
    result = chat.send_request()
    print(result)

def get_weather(location):
    return f"the weather in {location} is sunny with low tempratures. \n"

def AddAgent():
    SYSTEM_PROMPT = """
The way you use the tools is by specifying a json blob.
Specifically, this json should have an `action` key (with the name of the tool to use) and an `action_input` key (with the input to the tool going here).

The only values that should be in the "action" field are:
get_weather: Get the current weather in a given location, args: {'location': {'type': 'string'}}
example use : 

{{
  "action": "get_weather",
  "action_input": {{"location": "New York"}}
}}

ALWAYS use the following format:

Question: the input question you must answer
Thought: you should always think about one action to take. Only one action at a time in this format:
Action:

$JSON_BLOB (inside markdown cell)

Observation: the result of the action. This Observation is unique, complete, and the source of truth.
... (this Thought/Action/Observation can repeat N times, you should take several steps when needed. The $JSON_BLOB must be formatted as markdown and only use a SINGLE action at a time.)

You must always end your output with the following format:

Thought: I now know the final answer
Final Answer: the final answer to the original input question

Now begin! Reminder to ALWAYS use the exact characters `Final Answer:` when you provide a definitive answer.
"""
    chat = ChatAPI("YOUR-APIKEY-HERE")\
        .add_message("system",SYSTEM_PROMPT)\
        .add_message("user","What's the weather in London?")\
        .set_max_tokens(2048)\
        .set_stop_sequences("Observation:")
    result = chat.send_request()
    print(result)
    new_prompt = result+get_weather('London')
    print(get_weather('London'))
    chat.add_message("assistant",new_prompt)
    result = chat.send_request()
    print(result)
firstTry()
AddAgent()
