/*------------------------------------------------------------------------------
** B500Processor.js 
**------------------------------------------------------------------------------
**
** Operations implemented (and lightly tested)
**
**   Arithmatic Instructions
** ADD
** SUBTRACT
** MULTIPLY
** DIVIDE
**
**   Control Instructions
** ADDRESS MODIFICATION
** COMPARE EQUAL
** COMPARE UNEQUAL
** BRANCH
** NO-OPERATION
** HALT AND BRANCH
**
**   Editing Instructions
** TRANSFER
** TRANSFER ZONE
** DATA COMPRESS - untested
** DATA EXPAND - untested
** MASK - incomplete
**
**   Card input/output instructions (yes)
**   Print output instructions (yes)
**   Sorter Reader instructions (probably not)
**   Magnetic Tape instructions (yes)
**   Paper Tape instructions (? same as mag tape, almost)
**   Disk File instructions (yes)
**   Data Communication instructions (maybe)
**
**------------------------------------------------------------------------------
**
*/

"use strict"

const DEBUG = true ;
const memory_size = 19200 ;
const ASCII_GEQ = 'g' ;
const ASCII_LEQ = 'l' ;
const ASCII_NEQ = 'n' ;
const GROUP_MARK = 't' ;
const instruction_length = 12 ;
const section_length = 120 ;
const field_length = 12 ;
const CONDITION_OFF = 0x00 ;
const CONDITION_EQUAL = 0x01 ;
const CONDITION_LOW = 0x02 ;
const CONDITION_HIGH = 0x04 ;
const DEFAULT_INSTRUCTION_MICROSECONDS = 100 ;

//------------------------------------------------------------------------------
// B500Processor
//------------------------------------------------------------------------------
function B500Processor ()
{
this.test_program
    = "61 130      250J0000J3J0000ABCDEFGHIJtWXYZ            SIZE >"
    + "ABCDEFGHIJKLMNOPQRSTUVWXYZt                                 "
    + "00000012340x*,***,***,***.00-       800100110050Q1 050      "
    + "J  100010   705010   01561 180      705010   01561 200      "
    + "705010   01561 220      705010   01561 240      705010   015"
    + "61 260      705010   01561 280      705010   01561 300      "
    + "705010   01561 320      705010   01561 340      705010   015"
    + "61 360      705010   01561 380      705010   01561 400      "
    + "705010   01561 420      705010   01561 440      705010   015"
    + "61 460      705010   01561 480      705010   01561 500      "
    + "705010   01561 520      705010   01561 540      705010   015"
    + "61 560      705010   01561 580      705010   01561 600      "
    + "705010   01561 620      705010   01561 640      705010   015"
    + "61 660      705010   01561 680      705010   01561 700      "
    + "705010   01561 720      705010   01561 740      705010   015"
    + "61 760      705010   01561 780      705010   01561 800      "
    + "705010   01561 820      705010   01561 840      705010   015"
    + "61 860      705010   01561 880      705010   01561 900      "
    + "705010   01561 920      705010   01561 940      705010   015"
    + "61 960      705010   01561 980      705010   01561 +00      "
    + "705010   01561 +20      705010   01561 +40      705010   015"
    + "61 +60      705010   01561 +80      705010   01561 A00      "
    + "705010   01561 A20      705010   01561 A40      705010   015"
    + "61 A60      705010   01561 A80      705010   01561 B00      "
    + "705010   01561 B20      705010   01561 B40      705010   015"
    + "61 B60      705010   01561 B80      705010   01561 C00      "
    + "705010   01561 C20      705010   01561 C40      705010   015"
    + "61 C60      705010   01561 C80      705010   01561 D00      "
    + "705010   01561 D20      705010   01561 D40      705010   015"
    + "61 D60      705010   01561 D80      705010   01561 E00      "
    + "705010   01561 E20      705010   01561 E40      705010   015"
    + "61 E60      705010   01561 E80      705010   01561 F00      "
    + "705010   01561 F20      705010   01561 F40      705010   015"
    + "61 F60      705010   01561 F80      705010   01561 G00      "
    + "705010   01561 G20      705010   01561 G40      705010   015"
    + "61 G60      705010   01561 G80      705010   01561 H00      "
    + "705010   01561 H20      705010   01561 H40      705010   015"
    + "61 H60      705010   01561 H80      705010   01561 I00      "
    + "705010   01561 I20      705010   01561 I40      705010   015"
    + "61 I60      705010   01561 I80      705010   01561 x00      "
    + "705010   01561 x20      705010   01561 x40      705010   015"
    + "61 x60      705010   01561 x80      705010   01561 J00      "
    + "705010   01561 J20      705010   01561 J40      705010   015"
    + "61 J60      705010   01561 J80      705010   01561 K00      "
    + "705010   01561 K20      705010   01561 K40      705010   015"
    + "61 K60      705010   01561 K80      705010   01561 L00      "
    + "705010   01561 L20      705010   01561 L40      705010   015"
    + "61 L60      705010   01561 L80      705010   01561 M00      "
    + "705010   01561 M20      705010   01561 M40      705010   015"
    + "61 M60      705010   01561 M80      705010   01561 N00      "
    + "705010   01561 N20      705010   01561 N40      705010   015"
    + "61 N60      705010   01561 N80      705010   01561 O00      "
    + "705010   01561 O20      705010   01561 O40      705010   015"
    + "61 O60      705010   01561 O80      705010   01561 P00      "
    + "705010   01561 P20      705010   01561 P40      705010   015"
    + "61 P60      705010   01561 P80      705010   01561 Q00      "
    + "705010   01561 Q20      705010   01561 Q40      705010   015"
    + "61 Q60      705010   01561 Q80      705010   01561 R00      "
    + "705010   01561 R20      705010   01561 R40      705010   015"
    + "61 R60      705010   01561 R80      705010   01561  00      "
    + "705010   01561  20      705010   01561  40      705010   015"
    + "61  60      705010   01561  80      705010   01561 /00      "
    + "705010   01561 /20      705010   01561 /40      705010   015"
    + "61 /60      705010   01561 /80      705010   01561 S00      "
    + "705010   01561 S20      705010   01561 S40      705010   015"
    + "61 S60      705010   01561 S80      705010   01561 T00      "
    + "705010   01561 T20      705010   01561 T40      705010   015"
    + "61 T60      705010   01561 T80      705010   01561 U00      "
    + "705010   01561 U20      705010   01561 U40      705010   015"
    + "61 U60      705010   01561 U80      705010   01561 V00      "
    + "705010   01561 V20      705010   01561 V40      705010   015"
    + "61 V60      705010   01561 V80      705010   01561 W00      "
    + "705010   01561 W20      705010   01561 W40      705010   015"
    + "61 W60      705010   01561 W80      705010   01561 X00      "
    + "705010   01561 X20      705010   01561 X40      705010   015"
    + "61 X60      705010   01561 X80      705010   01561 Y00      "
    + "705010   01561 Y20      705010   01561 Y40      705010   015"
    + "61 Y60      705010   01561 Y80      705010   01561 Z00      "
    + "705010   01561 Z20      705010   01561 Z40      705010   015"
    + "61 Z60      705010   01561 Z80      705010   01561 0x0      "
    + "705010   01561 0K0      705010   01561 0M0      705010   015"
    + "61 0O0      705010   01561 0Q0      705010   01561 1x0      "
    + "705010   01561 1K0      705010   01561 1M0      705010   015"
    + "61 1O0      705010   01561 1Q0      705010   01561 2x0      "
    + "705010   01561 2K0      705010   01561 2M0      705010   015"
    + "61 2O0      705010   01561 2Q0      705010   01561 3x0      "
    + "705010   01561 3K0      705010   01561 3M0      705010   015"
    + "61 3O0      705010   01561 3Q0      705010   01561 4x0      "
    + "705010   01561 4K0      705010   01561 4M0      705010   015"
    + "61 4O0      705010   01561 4Q0      705010   01561 5x0      "
    + "705010   01561 5K0      705010   01561 5M0      705010   015"
    + "61 5O0      705010   01561 5Q0      705010   01561 6x0      "
    + "705010   01561 6K0      705010   01561 6M0      705010   015"
    + "61 6O0      705010   01561 6Q0      705010   01561 7x0      "
    + "705010   01561 7K0      705010   01561 7M0      705010   015"
    + "61 7O0      705010   01561 7Q0      705010   01561 8x0      "
    + "705010   01561 8K0      705010   01561 8M0      705010   015"
    + "61 8O0      705010   01561 8Q0      705010   01561 9x0      "
    + "705010   01561 9K0      705010   01561 9M0      705010   015"
    + "61 9O0      705010   01561 9Q0      705010   01561 +x0      "
    + "705010   01561 +K0      705010   01561 +M0      705010   015"
    + "61 +O0      705010   01561 +Q0      705010   01561 Ax0      "
    + "705010   01561 AK0      705010   01561 AM0      705010   015"
    + "61 AO0      705010   01561 AQ0      705010   01561 Bx0      "
    + "705010   01561 BK0      705010   01561 BM0      705010   015"
    + "61 BO0      705010   01561 BQ0      705010   01561 Cx0      "
    + "705010   01561 CK0      705010   01561 CM0      705010   015"
    + "61 CO0      705010   01561 CQ0      705010   01561 Dx0      "
    + "705010   01561 DK0      705010   01561 DM0      705010   015"
    + "61 DO0      705010   01561 DQ0      705010   01561 Ex0      "
    + "705010   01561 EK0      705010   01561 EM0      705010   015"
    + "61 EO0      705010   01561 EQ0      705010   01561 Fx0      "
    + "705010   01561 FK0      705010   01561 FM0      705010   015"
    + "61 FO0      705010   01561 FQ0      705010   01561 Gx0      "
    + "705010   01561 GK0      705010   01561 GM0      705010   015"
    + "61 GO0      705010   01561 GQ0      705010   01561 Hx0      "
    + "705010   01561 HK0      705010   01561 HM0      705010   015"
    + "61 HO0      705010   01561 HQ0      705010   01561 Ix0      "
    + "705010   01561 IK0      705010   01561 IM0      705010   015"
    + "61 IO0      705010   01561 IQ0      705010   01561 xx0      "
    + "705010   01561 xK0      705010   01561 xM0      705010   015"
    + "61 xO0      705010   01561 xQ0      705010   01561 Jx0      "
    + "705010   01561 JK0      705010   01561 JM0      705010   015"
    + "61 JO0      705010   01561 JQ0      705010   01561 Kx0      "
    + "705010   01561 KK0      705010   01561 KM0      705010   015"
    + "61 KO0      705010   01561 KQ0      705010   01561 Lx0      "
    + "705010   01561 LK0      705010   01561 LM0      705010   015"
    + "61 LO0      705010   01561 LQ0      705010   01561 Mx0      "
    + "705010   01561 MK0      705010   01561 MM0      705010   015"
    + "61 MO0      705010   01561 MQ0      705010   01561 Nx0      "
    + "705010   01561 NK0      705010   01561 NM0      705010   015"
    + "61 NO0      705010   01561 NQ0      705010   01561 Ox0      "
    + "705010   01561 OK0      705010   01561 OM0      705010   015"
    + "61 OO0      705010   01561 OQ0      705010   01561 Px0      "
    + "705010   01561 PK0      705010   01561 PM0      705010   015"
    + "61 PO0      705010   01561 PQ0      705010   01561 Qx0      "
    + "705010   01561 QK0      705010   01561 QM0      705010   015"
    + "61 QO0      705010   01561 QQ0      705010   01561 Rx0      "
    + "705010   01561 RK0      705010   01561 RM0      705010   015"
    + "61 RO0      705010   01561 RQ0      705010   01561  x0      "
    + "705010   01561  K0      705010   01561  M0      705010   015"
    + "61  O0      705010   01561  Q0      705010   01561 /x0      "
    + "705010   01561 /K0      705010   01561 /M0      705010   015"
    + "61 /O0      705010   01561 /Q0      705010   01561 Sx0      "
    + "705010   01561 SK0      705010   01561 SM0      705010   015"
    + "61 SO0      705010   01561 SQ0      705010   01561 Tx0      "
    + "705010   01561 TK0      705010   01561 TM0      705010   015"
    + "61 TO0      705010   01561 TQ0      705010   01561 Ux0      "
    + "705010   01561 UK0      705010   01561 UM0      705010   015"
    + "61 UO0      705010   01561 UQ0      705010   01561 Vx0      "
    + "705010   01561 VK0      705010   01561 VM0      705010   015"
    + "61 VO0      705010   01561 VQ0      705010   01561 Wx0      "
    + "705010   01561 WK0      705010   01561 WM0      705010   015"
    + "61 WO0      705010   01561 WQ0      705010   01561 Xx0      "
    + "705010   01561 XK0      705010   01561 XM0      705010   015"
    + "61 XO0      705010   01561 XQ0      705010   01561 Yx0      "
    + "705010   01561 YK0      705010   01561 YM0      705010   015"
    + "61 YO0      705010   01561 YQ0      705010   01561 Zx0      "
    + "705010   01561 ZK0      705010   01561 ZM0      705010   015"
    + "61 ZO0      705010   01561 ZQ0      705010   01561 0+0      "
    + "705010   01561 0B0      705010   01561 0D0      705010   015"
    + "61 0F0      705010   01561 0H0      705010   01561 1+0      "
    + "705010   01561 1B0      705010   01561 1D0      705010   015"
    + "61 1F0      705010   01561 1H0      705010   01561 2+0      "
    + "705010   01561 2B0      705010   01561 2D0      705010   015"
    + "61 2F0      705010   01561 2H0      705010   01561 3+0      "
    + "705010   01561 3B0      705010   01561 3D0      705010   015"
    + "61 3F0      705010   01561 3H0      705010   01561 4+0      "
    + "705010   01561 4B0      705010   01561 4D0      705010   015"
    + "61 4F0      705010   01561 4H0      705010   01561 5+0      "
    + "705010   01561 5B0      705010   01561 5D0      705010   015"
    + "61 5F0      705010   01561 5H0      705010   01561 6+0      "
    + "705010   01561 6B0      705010   01561 6D0      705010   015"
    + "61 6F0      705010   01561 6H0      705010   01561 7+0      "
    + "705010   01561 7B0      705010   01561 7D0      705010   015"
    + "61 7F0      705010   01561 7H0      705010   01561 8+0      "
    + "705010   01561 8B0      705010   01561 8D0      705010   015"
    + "61 8F0      705010   01561 8H0      705010   01561 9+0      "
    + "705010   01561 9B0      705010   01561 9D0      705010   015"
    + "61 9F0      705010   01561 9H0      705010   01561 ++0      "
    + "705010   01561 +B0      705010   01561 +D0      705010   015"
    + "61 +F0      705010   01561 +H0      705010   01561 A+0      "
    + "705010   01561 AB0      705010   01561 AD0      705010   015"
    + "61 AF0      705010   01561 AH0      705010   01561 B+0      "
    + "705010   01561 BB0      705010   01561 BD0      705010   015"
    + "61 BF0      705010   01561 BH0      705010   01561 C+0      "
    + "705010   01561 CB0      705010   01561 CD0      705010   015"
    + "61 CF0      705010   01561 CH0      705010   01561 D+0      "
    + "705010   01561 DB0      705010   01561 DD0      705010   015"
    + "61 DF0      705010   01561 DH0      705010   01561 E+0      "
    + "705010   01561 EB0      705010   01561 ED0      705010   015"
    + "61 EF0      705010   01561 EH0      705010   01561 F+0      "
    + "705010   01561 FB0      705010   01561 FD0      705010   015"
    + "61 FF0      705010   01561 FH0      705010   01561 G+0      "
    + "705010   01561 GB0      705010   01561 GD0      705010   015"
    + "61 GF0      705010   01561 GH0      705010   01561 H+0      "
    + "705010   01561 HB0      705010   01561 HD0      705010   015"
    + "61 HF0      705010   01561 HH0      705010   01561 I+0      "
    + "705010   01561 IB0      705010   01561 ID0      705010   015"
    + "61 IF0      705010   01561 IH0      705010   01561 x+0      "
    + "705010   01561 xB0      705010   01561 xD0      705010   015"
    + "61 xF0      705010   01561 xH0      705010   01561 J+0      "
    + "705010   01561 JB0      705010   01561 JD0      705010   015"
    + "61 JF0      705010   01561 JH0      705010   01561 K+0      "
    + "705010   01561 KB0      705010   01561 KD0      705010   015"
    + "61 KF0      705010   01561 KH0      705010   01561 L+0      "
    + "705010   01561 LB0      705010   01561 LD0      705010   015"
    + "61 LF0      705010   01561 LH0      705010   01561 M+0      "
    + "705010   01561 MB0      705010   01561 MD0      705010   015"
    + "61 MF0      705010   01561 MH0      705010   01561 N+0      "
    + "705010   01561 NB0      705010   01561 ND0      705010   015"
    + "61 NF0      705010   01561 NH0      705010   01561 O+0      "
    + "705010   01561 OB0      705010   01561 OD0      705010   015"
    + "61 OF0      705010   01561 OH0      705010   01561 P+0      "
    + "705010   01561 PB0      705010   01561 PD0      705010   015"
    + "61 PF0      705010   01561 PH0      705010   01561 Q+0      "
    + "705010   01561 QB0      705010   01561 QD0      705010   015"
    + "61 QF0      705010   01561 QH0      705010   01561 R+0      "
    + "705010   01561 RB0      705010   01561 RD0      705010   015"
    + "61 RF0      705010   01561 RH0      705010   01561  +0      "
    + "705010   01561  B0      705010   01561  D0      705010   015"
    + "61  F0      705010   01561  H0      705010   01561 /+0      "
    + "705010   01561 /B0      705010   01561 /D0      705010   015"
    + "61 /F0      705010   01561 /H0      705010   01561 S+0      "
    + "705010   01561 SB0      705010   01561 SD0      705010   015"
    + "61 SF0      705010   01561 SH0      705010   01561 T+0      "
    + "705010   01561 TB0      705010   01561 TD0      705010   015"
    + "61 TF0      705010   01561 TH0      705010   01561 U+0      "
    + "705010   01561 UB0      705010   01561 UD0      705010   015"
    + "61 UF0      705010   01561 UH0      705010   01561 V+0      "
    + "705010   01561 VB0      705010   01561 VD0      705010   015"
    + "61 VF0      705010   01561 VH0      705010   01561 W+0      "
    + "705010   01561 WB0      705010   01561 WD0      705010   015"
    + "61 WF0      705010   01561 WH0      705010   01561 X+0      "
    + "705010   01561 XB0      705010   01561 XD0      705010   015"
    + "61 XF0      705010   01561 XH0      705010   01561 Y+0      "
    + "705010   01561 YB0      705010   01561 YD0      705010   015"
    + "61 YF0      705010   01561 YH0      705010   01561 Z+0      "
    + "705010   01561 ZB0      705010   01561 ZD0      705010   015"
    + "61 ZF0      705010   01561 ZH0      705010   01561 0 0      "
    + "705010   01561 0S0      705010   01561 0U0      705010   015"
    + "61 0W0      705010   01561 0Y0      705010   01561 1 0      "
    + "705010   01561 1S0      705010   01561 1U0      705010   015"
    + "61 1W0      705010   01561 1Y0      705010   01561 2 0      "
    + "705010   01561 2S0      705010   01561 2U0      705010   015"
    + "61 2W0      705010   01561 2Y0      705010   01561 3 0      "
    + "705010   01561 3S0      705010   01561 3U0      705010   015"
    + "61 3W0      705010   01561 3Y0      705010   01561 4 0      "
    + "705010   01561 4S0      705010   01561 4U0      705010   015"
    + "61 4W0      705010   01561 4Y0      705010   01561 5 0      "
    + "705010   01561 5S0      705010   01561 5U0      705010   015"
    + "61 5W0      705010   01561 5Y0      705010   01561 6 0      "
    + "705010   01561 6S0      705010   01561 6U0      705010   015"
    + "61 6W0      705010   01561 6Y0      705010   01561 7 0      "
    + "705010   01561 7S0      705010   01561 7U0      705010   015"
    + "61 7W0      705010   01561 7Y0      705010   01561 8 0      "
    + "705010   01561 8S0      705010   01561 8U0      705010   015"
    + "61 8W0      705010   01561 8Y0      705010   01561 9 0      "
    + "705010   01561 9S0      705010   01561 9U0      705010   015"
    + "61 9W0      705010   01561 9Y0      705010   01561 + 0      "
    + "705010   01561 +S0      705010   01561 +U0      705010   015"
    + "61 +W0      705010   01561 +Y0      705010   01561 A 0      "
    + "705010   01561 AS0      705010   01561 AU0      705010   015"
    + "61 AW0      705010   01561 AY0      705010   01561 B 0      "
    + "705010   01561 BS0      705010   01561 BU0      705010   015"
    + "61 BW0      705010   01561 BY0      705010   01561 C 0      "
    + "705010   01561 CS0      705010   01561 CU0      705010   015"
    + "61 CW0      705010   01561 CY0      705010   01561 D 0      "
    + "705010   01561 DS0      705010   01561 DU0      705010   015"
    + "61 DW0      705010   01561 DY0      705010   01561 E 0      "
    + "705010   01561 ES0      705010   01561 EU0      705010   015"
    + "61 EW0      705010   01561 EY0      705010   01561 F 0      "
    + "705010   01561 FS0      705010   01561 FU0      705010   015"
    + "61 FW0      705010   01561 FY0      705010   01561 G 0      "
    + "705010   01561 GS0      705010   01561 GU0      705010   015"
    + "61 GW0      705010   01561 GY0      705010   01561 H 0      "
    + "705010   01561 HS0      705010   01561 HU0      705010   015"
    + "61 HW0      705010   01561 HY0      705010   01561 I 0      "
    + "705010   01561 IS0      705010   01561 IU0      705010   015"
    + "61 IW0      705010   01561 IY0      705010   01561 x 0      "
    + "705010   01561 xS0      705010   01561 xU0      705010   015"
    + "61 xW0      705010   01561 xY0      705010   01561 J 0      "
    + "705010   01561 JS0      705010   01561 JU0      705010   015"
    + "61 JW0      705010   01561 JY0      705010   01561 K 0      "
    + "705010   01561 KS0      705010   01561 KU0      705010   015"
    + "61 KW0      705010   01561 KY0      705010   01561 L 0      "
    + "705010   01561 LS0      705010   01561 LU0      705010   015"
    + "61 LW0      705010   01561 LY0      705010   01561 M 0      "
    + "705010   01561 MS0      705010   01561 MU0      705010   015"
    + "61 MW0      705010   01561 MY0      705010   01561 N 0      "
    + "705010   01561 NS0      705010   01561 NU0      705010   015"
    + "61 NW0      705010   01561 NY0      705010   01561 O 0      "
    + "705010   01561 OS0      705010   01561 OU0      705010   015"
    + "61 OW0      705010   01561 OY0      705010   01561 P 0      "
    + "705010   01561 PS0      705010   01561 PU0      705010   015"
    + "61 PW0      705010   01561 PY0      705010   01561 Q 0      "
    + "705010   01561 QS0      705010   01561 QU0      705010   015"
    + "61 QW0      705010   01561 QY0      705010   01561 R 0      "
    + "705010   01561 RS0      705010   01561 RU0      705010   015"
    + "61 RW0      705010   01561 RY0      705010   01561   0      "
    + "705010   01561  S0      999130                              "
    ;

this.console_message = {} ;

this.memory = new Uint8Array (memory_size).fill (0x30) ;
this.processor_halt = false ;
this.processor_fault = false ;
this.single_instruction = false ;
this.memory_display_idx = 0 ;
this.wait = 0 ;
this.sense_switches =
    {
    'sense_switch_6':false ,
    'sense_switch_5':false ,
    'sense_switch_4':false ,
    'sense_switch_3':false ,
    'sense_switch_2':false ,
    'sense_switch_1':false 
    } ;

this.conditional = CONDITION_OFF ;
this.instruction_idx = 0 ;
this.instruction_idx_next = 0 ;
this.current_instruction =      // Used by op handlers
    {
    address: [] ,
    op: ' ' ,
    m: ' ' ,
    n: ' ' ,
    aaa: [] ,
    bbb: [] ,
    ccc: [] ,
    microseconds: 0
    } ;
this.bcd =
    [
    {ascii: "0"} ,              // 0x00
    {ascii: "1"} ,
    {ascii: "2"} ,
    {ascii: "3"} ,
    {ascii: "4"} ,
    {ascii: "5"} ,
    {ascii: "6"} ,
    {ascii: "7"} ,
    {ascii: "8"} ,
    {ascii: "9"} ,
    {ascii: "#"} ,
    {ascii: "@"} ,
    {ascii: "?"} ,
    {ascii: ":"} ,
    {ascii: ">"} ,
    {ascii: ASCII_GEQ} ,
    {ascii: "+"} ,              // 0x10
    {ascii: "A"} ,
    {ascii: "B"} ,
    {ascii: "C"} ,
    {ascii: "D"} ,
    {ascii: "E"} ,
    {ascii: "F"} ,
    {ascii: "G"} ,
    {ascii: "H"} ,
    {ascii: "I"} ,
    {ascii: "."} ,
    {ascii: "["} ,
    {ascii: "&"} ,
    {ascii: "("} ,
    {ascii: "<"} ,
    {ascii: GROUP_MARK} ,   // control <-
    {ascii: "x"} ,          // Control  0x20        
    {ascii: "J"} ,
    {ascii: "K"} ,
    {ascii: "L"} ,
    {ascii: "M"} ,
    {ascii: "N"} ,
    {ascii: "O"} ,
    {ascii: "P"} ,
    {ascii: "Q"} ,
    {ascii: "R"} ,
    {ascii: "$"} ,
    {ascii: "*"} ,
    {ascii: "-"} ,
    {ascii: ")"} ,
    {ascii: ";"} ,
    {ascii: ASCII_LEQ} ,
    {ascii: " "} ,              // 0x30
    {ascii: "/"} ,
    {ascii: "S"} ,
    {ascii: "T"} ,
    {ascii: "U"} ,
    {ascii: "V"} ,
    {ascii: "W"} ,
    {ascii: "X"} ,
    {ascii: "Y"} ,
    {ascii: "Z"} ,
    {ascii: ","} ,
    {ascii: "%"} ,
    {ascii: ASCII_NEQ} ,
    {ascii: "="} ,
    {ascii: "]"} ,
    {ascii: '"'}    // Double quote
    ] ;
this.ascii_to_bcd = new Uint8Array (64) ;    // Built in initialize

this.initialize () ;

} // B500Processor //

//------------------------------------------------------------------------------
// initialize
//------------------------------------------------------------------------------
B500Processor.prototype.initialize = function ()
{
var idx ;

this.console_initialize () ;
this.update_power_on_light (true) ;
this.update_halt_light (true) ;

for (idx = 0 ; idx < this.bcd.length ; idx++)
    {
    this.ascii_to_bcd[this.bcd[idx]['ascii']] = idx ;
    }
for (idx = 0 ; idx < memory_size ; idx++)
    {
    this.memory [idx] = this.ascii_to_bcd [' '] ;
    }

for (idx = 0 ; idx < 64 ; idx++)
    {
    this.bcd [idx].op_function
		= this.invalid_operation.bind (this) ; // Init ops to all bad
    }

this.bcd [0x00].op_function = this.nop_operation.bind (this) ;      // "0"
this.bcd [0x01].op_function = this.add_operation.bind (this) ;      // "1"
this.bcd [0x02].op_function = this.subtract_operation.bind (this) ; // "2"
this.bcd [0x03].op_function = this.multiply_operation.bind (this) ; // "3"
this.bcd [0x04].op_function = this.divide_operation.bind (this) ;   // "4"
this.bcd [0x05].op_function = this.compare_operation.bind (this) ;  // "5"
this.bcd [0x06].op_function = this.branch_operation.bind (this) ;   // "6"
this.bcd [0x07].op_function = this.transfer_operation.bind (this) ; // "7"
this.bcd [0x08].op_function = this.mask_operation.bind (this) ;     // "8"
this.bcd [0x09].op_function = this.halt_operation.bind (this) ;     // "9"
this.bcd [0x0A].op_function = this.card_read_operation.bind (this) ; // "#"
this.bcd [0x11].op_function = this.print_operation.bind (this) ;	// "A"
this.bcd [0x21].op_function = this.address_modify_operation.bind (this) ; // "J"
this.bcd [0x24].op_function = this.data_compress_operation.bind (this) ; // "M"
this.bcd [0x25].op_function = this.data_expand_operation.bind (this) ; // "N"
this.bcd [0x27].op_function = this.transfer_zone_operation.bind (this) ; // "P"
this.bcd [0x28].op_function = this.spo_operation.bind (this) ; 		// "Q"
this.bcd [0x30].op_function = this.nop_operation.bind (this) ;		// " "
this.bcd [0x33].op_function = this.interrogate_operation.bind (this) ; // "T"

this.import_ascii (this.test_program ,
		    this.index_to_address (0) ,
		    this.test_program.length) ;
this.run_next = this.next_instruction.bind (this) ; 
//this.import_ascii (" 12111222333999000      " ,
//		    this.index_to_address (0) ,
//		    24) ;

this.clear_button () ;
this.console_refresh () ;

} // initialize //

//------------------------------------------------------------------------------
// console_initialize
//------------------------------------------------------------------------------
B500Processor.prototype.console_initialize = function ()
{
var init = {'action':'console_update' ,
	    'updates': []} ;
this.console_message = init ;

} // console_initialize //

//------------------------------------------------------------------------------
// console_refresh
//------------------------------------------------------------------------------
B500Processor.prototype.console_refresh = function ()
{
if (this.console_message.updates.length > 0)
    {
    self.postMessage (this.console_message) ;
    }
 
this.console_initialize () ;

} // console_refresh //

//------------------------------------------------------------------------------
// console_update
//------------------------------------------------------------------------------
B500Processor.prototype.console_update = function
    (
    panel_data ,
    refresh
    )
{

this.console_message.updates.push (panel_data) ;

if (refresh)
    {
    this.console_refresh () ;
    }

} // console_update //

//------------------------------------------------------------------------------
// instruction_display - display op, m variant, n variant
//------------------------------------------------------------------------------
B500Processor.prototype.instruction_display = function (instruction)
{

this.console_update ({'id':'instruction_display',
		    'value':instruction});

} // instruction_display //

//------------------------------------------------------------------------------
// memory_data_display - display memory data on panel
//------------------------------------------------------------------------------
B500Processor.prototype.memory_data_display = function (address)
{
var memory_slice ;
var bit_idx ;
var parity_bit = 1 ;	    // Start at odd

this.memory_display_idx = this.address_to_index (address) ;
memory_slice = this.memory.slice (this.memory_display_idx,
				    this.memory_display_idx + 1) ;
for (bit_idx = 0 ; bit_idx < 6 ; bit_idx++)	// add up bits
    {
    parity_bit += (memory_slice[0] >>> bit_idx) & 0x01 ;
    }
memory_slice[0] |= (parity_bit & 0x01) << 6 ;	// add parity bit

this.console_update ({"id":'memory_data_display',
		    "value":memory_slice});

} // memory_data_display //

//------------------------------------------------------------------------------
// memory_address_display - display memory address on panel
//------------------------------------------------------------------------------
B500Processor.prototype.memory_address_display = function (address)
{

this.console_update ({"id":'memory_address_display',
		    "value":address});

} // memory_address_display //

//------------------------------------------------------------------------------
// instruction_address_display - display instruction address on panel
//------------------------------------------------------------------------------
B500Processor.prototype.instruction_address_display = function (address)
{

this.console_update ({"id":'instruction_address_display',
		    "value":address});

} // instruction_address_display //

//------------------------------------------------------------------------------
// update_power_on_light
//------------------------------------------------------------------------------
B500Processor.prototype.update_power_on_light = function (light_on)
{

this.console_update ({'id':'power_on_light',
			"value":light_on} ,
		    true);

} // update_power_on_light //

//------------------------------------------------------------------------------
// update_continue_light
//------------------------------------------------------------------------------
B500Processor.prototype.update_continue_light = function (light_on)
{

this.console_update ({'id':'continue_light',
			"value":light_on} ,
		    true);

} // update_continue_light //

//------------------------------------------------------------------------------
// update_halt_light
//------------------------------------------------------------------------------
B500Processor.prototype.update_halt_light = function (light_on)
{

this.console_update ({'id':'halt_light',
			"value":light_on} ,
		    true);

} // update_halt_light //

//------------------------------------------------------------------------------
// update_central_processor_light
//------------------------------------------------------------------------------
B500Processor.prototype.update_central_processor_light = function (light_on)
{

this.console_update ({'id':'central_processor_light',
			"value":light_on} ,
		    true);

} // update_central_processor_light //

//------------------------------------------------------------------------------
// set_conditional
//------------------------------------------------------------------------------
B500Processor.prototype.set_conditional = function
    (val)		// <0 low, >0 high, otherwise equal
{

if (val < 0)
    {
    this.conditional = CONDITION_LOW ;
    }
else if (val > 0)
    {
    this.conditional = CONDITION_HIGH ;
    }
else
    {
    this.conditional = CONDITION_EQUAL ;
    }

} // set_conditional //

//------------------------------------------------------------------------------
// index_to_address
//------------------------------------------------------------------------------
B500Processor.prototype.index_to_address = function (idx)
{
var section = 0x00 ;
var field = 0x00 ;
var character = 0x00 ;
var idx_mod_4800 ;
var test_val ;
var address ;

idx_mod_4800 = idx % 4800 ;

test_val = Math.floor (idx_mod_4800 / 1200) ;
section |= (test_val << 4) & 0x30 ;
test_val = Math.floor ((idx_mod_4800 % 1200) / 120) ;
section |= test_val & 0x0F ;

test_val = Math.floor (((idx_mod_4800 % 1200) % 120) / 12) ;
field |= test_val & 0x0F ;
if (idx >= 9600)
    {
    field |= 0x10 ;
    }
if ((idx % 9600) >= 4800)
    {
    field |= 0x20 ;
    }

character = (idx % 12) ;

address = new Uint8Array ([section, field, character]) ;

return (address) ;

} // index_to_address //

//------------------------------------------------------------------------------
// address_to_index
//------------------------------------------------------------------------------
B500Processor.prototype.address_to_index = function (address)
{
var section = address [0] & 0x3F ;
var field = address [1] & 0x3F ;
var character = address [2] & 0x3F ;
var idx = 0 ;

if ((section & 0x0F) > 9)
    {
    return (-1) ;
    }
if ((field & 0x0F) > 9)
    {
    return (-1) ;
    }
if ((character & 0x0F) > 11)
    {
    return (-1) ;
    }

idx += ((section & 0x30) >>> 4) * (1200) ;
idx += (section & 0x0F) * 120 ;

if (field & 0x20)                       // field B bit
    {
    idx += (section_length * 40) ;      // 4800+
    }
if (field & 0x10)                       // field A bit
    {
    idx += (section_length * 80) ;      // 9600+
    }
idx += (field & 0x0F) * 12 ;

idx += (character & 0x0F) ;             // Characters

if (idx >= this.memory_size)
    {
    return (-1) ;
    }

return (idx) ;                          // Computed memory index

} // address_to_index //

//------------------------------------------------------------------------------
// bcd_to_integer
//------------------------------------------------------------------------------
B500Processor.prototype.bcd_to_integer = function
    (
    addr ,
    bcd_length
    )
{
var int_ret = 0 ;
var mem_idx = this.address_to_index (addr) ;
var bcd_count ;

if (bcd_length <= 0)
    {
    return (int_ret) ;
    }

for (bcd_count = 0 ; bcd_count < bcd_length ; bcd_count++)
    {
    int_ret *= 10 ;
    int_ret += this.memory [mem_idx] & 0x0f ;
    mem_idx++ ;
    }
if (this.memory [mem_idx - 1] & 0x20)		// B bit sign
    {
    int_ret *= -1 ;
    }

return (int_ret) ;

} // bcd_to_integer //

//------------------------------------------------------------------------------
// integer_to_bcd
//------------------------------------------------------------------------------
B500Processor.prototype.integer_to_bcd = function
    (
    int_in ,
    addr ,
    bcd_length
    )
{
var int_work = Math.abs (int_in) ;
var mem_idx = (this.address_to_index (addr) + bcd_length) - 1 ;
var bcd_count ;

for (bcd_count = 0 ; bcd_count < bcd_length ; bcd_count++)
    {
    this.memory [mem_idx] = (int_work % 10) & 0x0f ;
    int_work = Math.floor (int_work / 10) ;
    mem_idx-- ;
    }

if (int_in < 0)
    {
    this.memory [(mem_idx + bcd_length)] |= 0x20 ;
    }

} // integer_to_bcd //

//------------------------------------------------------------------------------
// compare_characters
//------------------------------------------------------------------------------
B500Processor.prototype.compare_characters = function
    (
    from_addr ,
    to_addr ,
    comp_length ,
    bit_pattern		// 0x3f - char, 0x0f - num, 0x30 - zone
    )
{
var from_idx = this.address_to_index (from_addr) ;
var to_idx = this.address_to_index (to_addr) ;
var comp_count ;
var comp_result = 0 ;

for (comp_count = 0 ; comp_count < comp_length ; comp_count++)
    {
    comp_result = (this.memory [from_idx] & bit_pattern)
		- (this.memory [to_idx] & bit_pattern) ;
    if (comp_result != 0)
	{
	break ;		// not equal
	}
    to_idx++ ;
    from_idx++ ;
    }

this.set_conditional (comp_result) ;

} // compare_characters //

//------------------------------------------------------------------------------
// transfer_characters
//------------------------------------------------------------------------------
B500Processor.prototype.transfer_characters = function
    (
    from_addr ,
    to_addr ,
    xfer_length ,
    bit_pattern
    )
{
var from_idx = this.address_to_index (from_addr) ;
var to_idx = this.address_to_index (to_addr) ;

for ( ; xfer_length > 0 ; xfer_length--)
    {
    //this.memory [to_idx] = this.memory [from_idx] ;
    this.memory [to_idx]
	= (this.memory [to_idx] & (! bit_pattern))
	| (this.memory [from_idx] & bit_pattern) ;
    to_idx++ ;
    from_idx++ ;
    }

return (xfer_length) ;

} // transfer_characters //

//------------------------------------------------------------------------------
// import_ascii
//------------------------------------------------------------------------------
B500Processor.prototype.import_ascii = function
    (
    from_text ,
    to_addr ,
    xfer_length
    )
{
var to_idx = this.address_to_index (to_addr) ;
var from_idx = 0 ;

for ( ; xfer_length > 0 ; xfer_length--)
    {
    this.memory [to_idx] = this.ascii_to_bcd [from_text [from_idx]] ;
    to_idx++ ;
    from_idx++ ;
    }

return (xfer_length) ;

} // import_ascii //

//------------------------------------------------------------------------------
// increase_address_and_read_button
//------------------------------------------------------------------------------
B500Processor.prototype.increase_address_and_read_button = function ()
{
var mem_idx = this.memory_display_idx += 1 ;
var mem_addr ;

if (mem_idx >= this.memory_size)
    {
    mem_idx = 0 ;
    }

mem_addr = this.index_to_address (mem_idx) ;
this.memory_address_display (mem_addr) ;
this.memory_data_display (mem_addr) ;

this.console_refresh () ;

} // increase_address_and_read_button //

//------------------------------------------------------------------------------
// toggle_sense_switch
//------------------------------------------------------------------------------
B500Processor.prototype.toggle_sense_switch = function (switch_id)
{

this.sense_switches[switch_id] = ! this.sense_switches[switch_id] ;

this.console_update ({'id':switch_id + '_light',
			'value':this.sense_switches[switch_id]} ,
		    true);

} // toggle_sense_switch //

//------------------------------------------------------------------------------
// LOAD button
//------------------------------------------------------------------------------
B500Processor.prototype.load_button = function ()
{

} // load_button //

//------------------------------------------------------------------------------
// SINGLE INST button
//------------------------------------------------------------------------------
B500Processor.prototype.single_inst_button = function ()
{

this.single_instruction = true ;
this.processor_halt = false ;
this.run () ;

} // single_inst_button //

//------------------------------------------------------------------------------
// CLEAR button
//------------------------------------------------------------------------------
B500Processor.prototype.clear_button = function ()
{
var addr ;

this.processor_halt = true ;
this.single_instruction = false ;
this.instruction_idx = 0 ;
this.instruction_idx_next = 0 ;

addr = this.index_to_address (this.instruction_idx) ;
this.instruction_display 
    (this.memory.slice (this.instruction_idx, this.instruction_idx + 3)) ;
this.memory_data_display (addr) ;
this.memory_address_display (addr) ;
this.instruction_address_display (addr) ;

this.console_refresh () ;

} // clear_button //

//------------------------------------------------------------------------------
// HALT button
//------------------------------------------------------------------------------
B500Processor.prototype.halt_button = function ()
{

this.processor_halt = true ;

} // halt_button //

//------------------------------------------------------------------------------
// CONTINUE button
//------------------------------------------------------------------------------
B500Processor.prototype.continue_button = function ()
{

this.processor_halt = false ;
this.single_instruction = false ;
this.update_halt_light (false) ;
this.update_continue_light (true) ;
this.update_central_processor_light (true) ;

this.run () ;

} // continue_button //

//------------------------------------------------------------------------------
// next_instruction
//------------------------------------------------------------------------------
B500Processor.prototype.next_instruction = function ()
{

this.wait = 0 ;

this.run () ;

} // next_instruction //

//------------------------------------------------------------------------------
// enter_wait
//------------------------------------------------------------------------------
B500Processor.prototype.enter_wait = function ()
{

this.wait = 0 ;

this.update_halt_light (true) ;
this.update_continue_light (false) ;
this.update_central_processor_light (false) ;

} // enter_wait //

//##############################################################################
// Instruction handlers
//##############################################################################

//------------------------------------------------------------------------------
// run
//------------------------------------------------------------------------------
B500Processor.prototype.run = function ()
{

//self.postMessage ({'action':'alert', 'alert':'run>enter'}) ;
if (this.wait > 0)
    {
//self.postMessage ({'action':'alert', 'alert':'run>Already running'}) ;
    return ;				// Already running
    }
this.wait = 5 ;

if (this.processor_halt)
    {
    this.enter_wait () ;
    return ;
    }

this.instruction_idx = this.instruction_idx_next ;          // New current instruction
this.instruction_idx_next = this.instruction_idx + instruction_length ;

this.current_instruction.address = this.index_to_address (this.instruction_idx) ; 
this.current_instruction.op = this.memory [this.instruction_idx] ;   // op
this.current_instruction.m = this.memory [this.instruction_idx + 1] ; // m
this.current_instruction.n = this.memory [this.instruction_idx + 2] ; // n
this.current_instruction.aaa                                         // AAA
    = this.memory.slice (this.instruction_idx + 3, this.instruction_idx + 6) ;
this.current_instruction.bbb                                         // BBB
    = this.memory.slice (this.instruction_idx + 6, this.instruction_idx + 9) ;
this.current_instruction.ccc                                         // CCC
    = this.memory.slice (this.instruction_idx + 9, this.instruction_idx + 12) ;
this.instruction_display (this.memory.slice (this.instruction_idx,
					    this.instruction_idx + 3)) ;
this.instruction_address_display (this.current_instruction.address) ;
this.memory_address_display (this.current_instruction.address) ;
this.memory_data_display (this.current_instruction.address) ;
this.console_refresh () ;

this.current_instruction.microseconds = 0 ;	// execution time us
this.bcd [this.current_instruction.op].op_function () ;
if (this.single_instruction)
    {
    this.enter_wait () ;
    return ;
    }

setTimeout (this.run_next, this.wait) ;

} // run //

//------------------------------------------------------------------------------
// add_operation
//------------------------------------------------------------------------------
B500Processor.prototype.add_operation = function ()
{
var addend_length = this.current_instruction.m & 0x0f ;
var augend_length = this.current_instruction.n & 0x0f ;
var addend ;
var augend ;
var sum ;

if (addend_length <= 0)
    {
    addend_length = 12 ;
    }
addend = this.bcd_to_integer (this.current_instruction.aaa,
				addend_length) ;
if (augend_length <= 0)
    {
    augend_length = 12 ;
    }
augend = this.bcd_to_integer (this.current_instruction.bbb,
				augend_length) ;

sum = augend + addend ;

this.integer_to_bcd (sum ,
			this.current_instruction.ccc,
			Math.max (addend_length, augend_length)) ;

this.set_conditional (sum) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // add_operation //

//------------------------------------------------------------------------------
// address_modify_operation
//------------------------------------------------------------------------------
B500Processor.prototype.address_modify_operation = function ()
{
var increment ;
var addr_idx ;
var mod_addr ;
var mod_addr_idx ;

increment = (((this.current_instruction.aaa[0] & 0x0f) * 10)
            + (this.current_instruction.aaa[1] & 0x0f)) * 12
            + (this.current_instruction.aaa[2] & 0x0f) ;
if (increment == 0)
    {
    increment = 1200 ;
    }

addr_idx = this.address_to_index (this.current_instruction.bbb) ;
mod_addr = 
    [
    this.memory [addr_idx] ,
    this.memory [addr_idx + 1] ,
    this.memory [addr_idx + 2]
    ] ;
mod_addr_idx = this.address_to_index (mod_addr) + increment ;
mod_addr  = this.index_to_address (mod_addr_idx) ;
this.memory [addr_idx] = mod_addr [0] ;
this.memory [addr_idx + 1] = mod_addr [1] ;
this.memory [addr_idx + 2] = mod_addr [2] ;
//this.mem_dump_message (this.current_instruction.bbb, 3) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // address_modify_operation //

//------------------------------------------------------------------------------
// branch_operation
//------------------------------------------------------------------------------
B500Processor.prototype.branch_operation = function ()
{

if (this.current_instruction.m & 0x01)
    {				    // Branch unconditional
    this.instruction_idx_next
	= this.address_to_index (this.current_instruction.aaa) ;
    this.current_instruction.microseconds += 42 ;
    }
else
    {				    // Branch conditional
    if (this.conditional & CONDITION_LOW)
	{
	this.instruction_idx_next
	    = this.address_to_index (this.current_instruction.aaa) ;
	}
    else if (this.conditional & CONDITION_HIGH)
	{
	this.instruction_idx_next
	    = this.address_to_index (this.current_instruction.ccc) ;
	}
    else //if (this.conditional & CONDITION_EQUAL)
	{
	this.instruction_idx_next
	    = this.address_to_index (this.current_instruction.bbb) ;
	}
    this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;
    }

} // branch_operation //

//------------------------------------------------------------------------------
// card_read_operation
//------------------------------------------------------------------------------
B500Processor.prototype.card_read_operation = function ()
{
//var not_ready_idx = this.address_to_index (this.current_instruction.aaa) ;
//var eof_idx = this.address_to_index (this.current_instruction.bbb) ;
var input_idx = this.address_to_index (this.current_instruction.ccc) ;


this.set_conditional (0) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // card_read_operation //

//------------------------------------------------------------------------------
// compare_operation
//------------------------------------------------------------------------------
B500Processor.prototype.compare_operation = function ()
{
var comp_length = this.current_instruction.n & 0x0f ;
var bit_pattern ;	// 0x3f - char, 0x0f - num, 0x30 - zone
var branch_type = 1 ;	// 1 - equal, 2 - unequal

if (comp_length <= 0)
    {
    comp_length = 12 ;
    }

switch (this.current_instruction.m & 0x0f)
    {
    case 0x00 :			// char =
	bit_pattern = 0x3f ;
	break ;
    case 0x01 :			// zone =
	bit_pattern = 0x30 ;
	break ;
    case 0x02 :			// num =
	bit_pattern = 0x0f ;
	break ;
    case 0x04 :			// char !=
	bit_pattern = 0x3f ;
	branch_type = 2 ;
	break ;
    case 0x05 :			// zone !=
	bit_pattern = 0x30 ;
	branch_type = 2 ;
	break ;
    case 0x06 :			// num !=
	bit_pattern = 0x0f ;
	branch_type = 2 ;
	break ;
    default :
	return ;	// Fault
	break ;
    }


this.compare_characters
    (
    this.address_to_index (this.current_instruction.aaa) ,
    this.address_to_index (this.current_instruction.bbb) ,
    comp_length ,
    bit_pattern
    ) ;

if (branch_type == 1)		// Branch if required
    {
    if (this.conditional & CONDITION_EQUAL)
        {			// Equal branch
	this.instruction_idx_next
	    = this.address_to_index (this.current_instruction.ccc) ;
        }
    }
else
    {
    if (this.conditional & (! CONDITION_EQUAL))
        {			// Unequal branch
	this.instruction_idx_next
	    = this.address_to_index (this.current_instruction.ccc) ;
        }
    }

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // compare_operation //

//------------------------------------------------------------------------------
// data_compress_operation
//------------------------------------------------------------------------------
B500Processor.prototype.data_compress_operation = function ()
{
var from_idx = this.address_to_index (this.current_instruction.aaa) ;
var to_idx = this.address_to_index (this.current_instruction.ccc) ;
var record_length = ((this.current_instruction.bbb[0] & 0x0f) * 120)
					+ ((this.current_instruction.bbb[1] & 0x0f) * 12) 
					+ (this.current_instruction.bbb[1] & 0x0f) ;
var from_end_idx = from_idx + record_length ;

while (from_idx < from_end_idx)
	{
	this.memory [to_idx] = 0x00 ;
	this.memory [to_idx] &= (this.memory [from_idx] << 2) & 0x3c ;
	from_idx ++ ;
	if (from_idx < from_end_idx)
		{
		this.memory [to_idx] &= (this.memory [from_idx] >> 2) & 0x03 ;
		to_idx++ ;
		this.memory [to_idx] = 0x00 ;
		this.memory [to_idx] &= (this.memory [from_idx] << 4) & 0x30 ;
		from_idx ++ ;
		if (from_idx < from_end_idx)
			{
			this.memory [to_idx] &= (this.memory [from_idx]) & 0x0f ;
			to_idx++ ;
			from_idx ++ ;
			}
		}
	}

this.set_conditional (0) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // data_compress_operation //

//------------------------------------------------------------------------------
// data_expand_operation
//------------------------------------------------------------------------------
B500Processor.prototype.data_expand_operation = function ()
{
var from_idx = this.address_to_index (this.current_instruction.aaa) ;
var to_idx = this.address_to_index (this.current_instruction.ccc) ;
var record_length = ((this.current_instruction.bbb[0] & 0x0f) * 120)
					+ ((this.current_instruction.bbb[1] & 0x0f) * 12) 
					+ (this.current_instruction.bbb[1] & 0x0f) ;
var to_end_idx = to_idx + record_length ;

while (to_idx < to_end_idx)
	{
	this.memory [to_idx] = 0x00 ;
	this.memory [to_idx] &= (this.memory [from_idx] >> 2) & 0x0f ;
	to_idx++ ;
	if (to_idx < to_end_idx)
		{
		this.memory [to_idx] = 0x00 ;
		this.memory [to_idx] &= (this.memory [from_idx] << 2) & 0x0c ;
		from_idx++ ;
		this.memory [to_idx] &= (this.memory [from_idx] >> 4) & 0x03 ;
		to_idx++ ;
		if (to_idx < to_end_idx)
			{
			this.memory [to_idx] = 0x00 ;
			this.memory [to_idx] &= this.memory [from_idx] & 0x0f ;
			to_idx++ ;
			from_idx++ ;
			}
		}
	}

this.set_conditional (0) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // data_expand_operation //

//------------------------------------------------------------------------------
// divide_operation
//------------------------------------------------------------------------------
B500Processor.prototype.divide_operation = function ()
{
var dividend_length = this.current_instruction.m & 0x0f ;
var divisor_length = this.current_instruction.n & 0x0f ;
var quotient_length ;
var dividend ;
var divisor ;
var quotient ;
var remainder ;

if (dividend_length <= 0)
    {
    dividend_length = 12 ;
    }
dividend = this.bcd_to_integer (this.current_instruction.aaa,
				dividend_length) ;
if (divisor_length <= 0)
    {
    divisor_length = 12 ;
    }
divisor = this.bcd_to_integer (this.current_instruction.bbb,
				divisor_length) ;
if (divisor == 0)
    {
    return ;		// fault
    }
quotient_length = dividend_length - divisor_length ;
if (quotient_length <= 0)
    {
    return ;		// fault
    }

quotient = Math.floor (dividend / divisor) ;
remainder = Math.abs (dividend) % Math.abs (divisor) ;

this.integer_to_bcd (quotient,
			this.current_instruction.ccc,
			quotient_length) ;
this.integer_to_bcd (remainder ,
			this.current_instruction.aaa,
			dividend_length) ;

this.set_conditional (quotient) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // divide_operation //

//------------------------------------------------------------------------------
// halt_operation
//------------------------------------------------------------------------------
B500Processor.prototype.halt_operation = function ()
{

this.processor_halt = true ;

this.instruction_idx_next
    = this.address_to_index (this.current_instruction.aaa) ;

} // halt_operation //

//------------------------------------------------------------------------------
// interrogate_operation
//------------------------------------------------------------------------------
B500Processor.prototype.interrogate_operation = function ()
{


this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // interrogate_operation //

//------------------------------------------------------------------------------
// fiscal_mask
//------------------------------------------------------------------------------
B500Processor.prototype.fiscal_mask = function
    (
    b_comma ,
    b_decimal
    )
{
var from_idx = this.address_to_index (this.current_instruction.aaa) ;
var from_end_idx ;
var mask_idx = this.address_to_index (this.current_instruction.bbb) ;
var to_idx = this.address_to_index (this.current_instruction.ccc) ;
var from_length = this.current_instruction.m & 0x0f ;
var b_blank = this.ascii_to_bcd [' '] ;
var b_dollar = this.ascii_to_bcd ['$'] ;
var mask_char = ' ' ;
var insert_all = false ;

if (from_length == 0)
	{
	from_length = 12 ;
	}
from_end_idx = from_idx + from_length ;
//this.mem_dump_message (this.current_instruction.aaa, from_length) ;
//this.mem_dump_message (this.current_instruction.bbb, 20) ;

while (from_idx < from_end_idx)
    {
    if ((this.memory [from_idx] & 0x0f) != 0x00)
	{
	insert_all = true ;
	}
    else if (this.memory [mask_idx] == b_decimal)
	{
	insert_all = true ;
	}
    else if (this.memory [mask_idx] == b_dollar)
	{
	//insert_all = true ;
	this.memory [to_idx] = this.memory [mask_idx] ;
    	to_idx++ ;
        mask_idx++ ;
	}
    if (insert_all)
	{
	if (this.memory [mask_idx] == b_comma
	    || this.memory [mask_idx] == b_decimal)
	    {
	    this.memory [to_idx] = this.memory [mask_idx] ;
	    }
	else
	    {
	    this.memory [to_idx] = this.memory [from_idx] & 0x0f ;
            from_idx++ ;
	    }
	}
    else
	{
	if (this.memory [mask_idx] == b_comma
	    || this.memory [mask_idx] == b_decimal)
	    {
	    this.memory [to_idx] = mask_char ;
	    }
	else
	    {
	    this.memory [to_idx] = this.memory [mask_idx] ;
	    mask_char = this.memory [mask_idx] ;
            from_idx++ ;
	    }
	}
    to_idx++ ;
    mask_idx++ ;
//this.mem_dump_message (this.current_instruction.ccc, 26) ;
    }

from_idx-- ;					// test sign
if (this.memory [from_idx] && 0x20)
    {						// negative
    this.memory [to_idx] = this.memory [mask_idx] ;
    }
else
    {						// non-negative
    this.memory [to_idx] = b_blank ;
    }
//this.mem_dump_message (this.current_instruction.ccc, 26) ;

this.set_conditional (0) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // fiscal_mask //

//------------------------------------------------------------------------------
// alphanumeric_mask
//------------------------------------------------------------------------------
B500Processor.prototype.alphanumeric_mask = function ()
{
var from_idx = this.address_to_index (this.current_instruction.aaa) ;
var from_end_idx ;
var mask_idx = this.address_to_index (this.current_instruction.bbb) ;
var to_idx = this.address_to_index (this.current_instruction.ccc) ;
var from_length = this.current_instruction.m & 0x0f ;
var b_blank = this.ascii_to_bcd [' '] ;
var mask_char = ' ' ;

if (from_length == 0)
	{
	from_length = 12 ;
	}
from_end_idx = from_idx + from_length ;
this.mem_dump_message (this.current_instruction.aaa, from_length) ;

//################### NEED
	
this.mem_dump_message (this.current_instruction.ccc, 26) ;

this.set_conditional (0) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // alphanumeric_mask //

//------------------------------------------------------------------------------
// mask_operation
//------------------------------------------------------------------------------
B500Processor.prototype.mask_operation = function ()
{
var b_comma = this.ascii_to_bcd [','] ;
var b_decimal = this.ascii_to_bcd ['.'] ;

switch (this.current_instruction.n & 0x0f)
    {
    case 0 :					// fiscal standard
	this.fiscal_mask (b_comma, b_decimal) ;
        break ;
    case 1 :					// fiscal inverted
	this.fiscal_mask (b_decimal, b_comma) ;
        break ;
    default :					// alphanumeric
	this.alphanumeric_mask (b_decimal, b_comma) ;	// NEED
        break ;
    }

} // mask_operation //

//------------------------------------------------------------------------------
// multiply_operation
//------------------------------------------------------------------------------
B500Processor.prototype.multiply_operation = function ()
{
var multiplicand_length = this.current_instruction.m & 0x0f ;
var multiplier_length = this.current_instruction.n & 0x0f ;
var multiplicand ;
var multiplier ;
var product ;

if (multiplicand_length <= 0)
    {
    multiplicand_length = 12 ;
    }
multiplicand = this.bcd_to_integer (this.current_instruction.aaa,
				multiplicand_length) ;
if (multiplier_length <= 0)
    {
    multiplier_length = 12 ;
    }
multiplier = this.bcd_to_integer (this.current_instruction.bbb,
				multiplier_length) ;

product = multiplier * multiplicand ;

this.integer_to_bcd (product,
			this.current_instruction.ccc,
			(multiplicand_length + multiplier_length)) ;

this.set_conditional (product) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // multiply_operation //

//------------------------------------------------------------------------------
// nop_operation
//------------------------------------------------------------------------------
B500Processor.prototype.nop_operation = function ()
{

this.current_instruction.microseconds += 10 ;

} // nop_operation //

//------------------------------------------------------------------------------
// print_operation
//------------------------------------------------------------------------------
B500Processor.prototype.print_operation = function ()
{
//var not_ready_idx = this.address_to_index (this.current_instruction.aaa) ;
//var eof_idx = this.address_to_index (this.current_instruction.bbb) ;
//var input_idx = this.address_to_index (this.current_instruction.ccc) ;


this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // print_operation //

//------------------------------------------------------------------------------
// spo_print
//------------------------------------------------------------------------------
B500Processor.prototype.spo_print = function ()
{
var output_idx = this.address_to_index (this.current_instruction.aaa) ;
var text_out = '' ;
var mess = {'action':'spo'} ;
//this.inst_dump_message () ;

while (text_out.length <= 80)
	{
	if (this.memory[output_idx] == 0x1f)
		{
		break ;
		}
	text_out += this.bcd [this.memory [output_idx]].toString () ;
	output_idx++
	}

//this.mem_dump_message (this.current_instruction.aaa, 26) ;
this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // spo_print //

//------------------------------------------------------------------------------
// spo_read
//------------------------------------------------------------------------------
B500Processor.prototype.spo_read = function ()
{
var input_branch_idx = this.address_to_index (this.current_instruction.bbb) ;
var output_idx = this.address_to_index (this.current_instruction.ccc) ;


//this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // spo_read //

//------------------------------------------------------------------------------
// spo_operation
//------------------------------------------------------------------------------
B500Processor.prototype.spo_operation = function ()
{

switch (this.current_instruction.m & 0x0f)
    {
    case 1 :					// spo print
	this.spo_print () ;
        break ;
    case 2 :					// spo read
	this.spo_read () ;
        break ;
    default :					// fault
this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;
        break ;
    }

} // spo_operation //

//------------------------------------------------------------------------------
// subtract_operation
//------------------------------------------------------------------------------
B500Processor.prototype.subtract_operation = function ()
{
var minuend_length = this.current_instruction.m & 0x0f ;
var subtrahend_length = this.current_instruction.n & 0x0f ;
var minuend ;
var subtrahend ;
var difference ;

if (minuend_length <= 0)
    {
    minuend_length = 12 ;
    }
minuend = this.bcd_to_integer (this.current_instruction.aaa,
				minuend_length) ;
if (subtrahend_length <= 0)
    {
    subtrahend_length = 12 ;
    }
subtrahend = this.bcd_to_integer (this.current_instruction.bbb,
				subtrahend_length) ;

difference = minuend - subtrahend ;

this.integer_to_bcd (difference ,
			this.current_instruction.ccc,
			Math.max (minuend_length, subtrahend_length)) ;

this.set_conditional (difference) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // subtract_operation //

//------------------------------------------------------------------------------
// transfer_operation
//------------------------------------------------------------------------------
B500Processor.prototype.transfer_operation = function ()
{
var fields = this.current_instruction.m & 0x0f ;
var chars = this.current_instruction.n & 0x0f ;
var length ;
// validate m/n

length = (fields * 12) + chars ;
if (length == 0)
    {
    length = 120 ;
    }

this.transfer_characters
    (
    this.current_instruction.aaa ,
    this.current_instruction.ccc ,
    length ,
    0x3f
    ) ;

if (this.current_instruction.n & 0x20)	// N var B bit
    {
    this.instruction_idx_next
        = this.address_to_index (this.current_instruction.bbb) ;
    }

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // transfer_operation //

//------------------------------------------------------------------------------
// transfer_zone_operation
//------------------------------------------------------------------------------
B500Processor.prototype.transfer_zone_operation = function ()
{
var fields = this.current_instruction.m & 0x0f ;
var chars = this.current_instruction.n & 0x0f ;

// validate m/n

if (fields == 0)
    {
    fields = 11 ;
    chars = 0 ;
    }

this.transfer_characters
    (
    this.current_instruction.aaa ,
    this.current_instruction.ccc ,
    (fields * 12) + chars ,
    0x30
    ) ;

if (this.current_instruction.n & 0x20)	// N var B bit
    {
    this.instruction_idx_next
        = this.address_to_index (this.current_instruction.bbb) ;
    }

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // transfer_zone_operation //

//------------------------------------------------------------------------------
// invalid_operation - Invalid op code
//------------------------------------------------------------------------------
B500Processor.prototype.invalid_operation = function ()
{

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // invalid_operation //

//------------------------------------------------------------------------------
// mem_dump_message
//------------------------------------------------------------------------------
B500Processor.prototype.mem_dump_message = function
    (
    addr ,
    len
    )
{
var mess = {'action':'memdump'} ;
var text = '' ;
var idx ;
var mem_idx = this.address_to_index (addr) ;

for (idx = 0 ; idx < addr.length ; idx++)
    {
    text += this.bcd [addr [idx]].ascii ;
    }
text += ':' ;

for (idx = 0 ; idx < len ; idx++)
    {
    text += this.bcd [this.memory [mem_idx + idx]].ascii ;
    }

mess.text = text ;
if (DEBUG)
    {
    self.postMessage (mess) ;
    }

} // mem_dump_message //

//------------------------------------------------------------------------------
// inst_dump_message
//------------------------------------------------------------------------------
B500Processor.prototype.inst_dump_message = function ()
{

this.mem_dump_message (this.current_instruction.address, 12) ;

} // inst_dump_message //

//##############################################################################

var processor = new B500Processor ;

//self.addEventListener('message', function(e)
onmessage = function(e)
{
var data = e.data;

switch (data.action)
    {
    case 'hello':
	self.postMessage (data) ;
	break ;
    case 'button_pressed':
	//self.postMessage ({'action':'alert', 'alert': data.action}) ;
	switch (data.button)
	    {
	    case 'read':
		processor.read_button () ;
		break ;
	    case 'memory_increase_read':
		processor.increase_address_and_read_button () ;
		break ;
	    case 'clear':
		processor.clear_button () ;
		break ;
	    case 'halt':
		processor.halt_button () ;
		break ;
	    case 'continue':
		processor.continue_button () ;
		break ;
	    case 'sense_switch_6':
	    case 'sense_switch_5':
	    case 'sense_switch_4':
	    case 'sense_switch_3':
	    case 'sense_switch_2':
	    case 'sense_switch_1':
		processor.toggle_sense_switch (data.button) ;
		break ;
	    case 'single_inst':
		processor.single_inst_button () ;
		break ;
	    default:
		break ;
	    }
      //self.postMessage(result);
      break;
    default:
      self.postMessage('Unknown command');
  }
}
//}, false);

