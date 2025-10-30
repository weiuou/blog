---
title: Solidity包装类型
date: 2025-09-18 21:40:28
tags:
  - 智能合约
  - Solidity
  - 区块链
---
基于现有的基本类型的包装类型，提供类型安全而不增加存储开销
~~~Solidity
type Duration is uint64;
type Timestamp is uint64;
type Clock is uint128;
~~~

定义Clock的低64位是Timestamp,高64位是Duration，使用包装类型处理可以有效避免相同基本类型参数顺序错误

~~~Solidity
library LibClock {
	function warp(Duration _duration, Timestamp _timestamp)
		internal 
		pure 
		returns (Clock clock_)
	{
		assembly{
			clock_ := or(shl(0x40, _duration), _timestamp)
		}
	}
	
	function duration(Clock _clock)
		internal
		pure
		returns (Duration duration_)
	{
		assembly{
			//取_clock高64位
			duration_ := shr(0x40, _clock)
		}
	}
	
	function timestamp(Clock _clock)
		internal
		pure
		returns (Timestamp timestamp_)
		{
			assembly{
				//左移192位让高64位溢出再右移192位
				timestamp_ := shr(0xC0,shl(0xC0, _clock))
			}
		}
}
~~~

<center>以上是使用了包装类型的写法</center>

~~~Solidity
library LibClockBasic {
	function warp(uint64 _duration, uint64 _timestamp)
		internal 
		pure 
		returns (uint128 clock_)
	{
		assembly{
			clock_ := or(shl(0x40, _duration), _timestamp)
		}
	}
	
	function duration(uint128 _clock)
		internal
		pure
		returns (uint64 duration_)
	{
		assembly{
			//取_clock高64位
			duration_ := shr(0x40, _clock)
		}
	}
	
	function timestamp(uint128 _clock)
		internal
		pure
		returns (uint64 timestamp_)
		{
			assembly{
				//左移192位让高64位溢出再右移192位
				timestamp_ := shr(0xC0,shl(0xC0, _clock))
			}
		}
}
~~~

<center>这是使用基本类型的写法</center>
这两种写法看起来都是正确的，但是在实际使用的时候

~~~Solidity
	//使用基本类型
	function example_uvdt() external view {
		uint128 clock;
		uint d = 1;
		uint t = uint64(block.timestamp);
		
		//正确用法
		clock = LibClockBasic.warp(d, t);
		
		//错误用法，但能通过编译
		clock = LibClockBasic.warp(t,d);
	}
	
	//使用包装类型
	function example_uvdt() external view{
		Duration d = Duration.warp(1);
		Timestamp t = Timestamp.warp(uint64(block.timestamp));
		
		//正确用法
		Clock clock = LibClock.warp(d,t);
		
		//调换顺序将无法编译
		//Clock clock = LibClock.warp(t,d);
	}
~~~

通过包装类型实现了在编译时检查错误，这对于智能合约开发、调试是很重要的。