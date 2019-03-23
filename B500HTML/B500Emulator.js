/*


*/

var worker = new Worker ('./B500Processor.js');


//------------------------------------------------------------------------------
// event listener
//------------------------------------------------------------------------------
//worker.addEventListener('message', function(e)
worker.onmessage = function(e)
{
var data = e.data;

//alert ('listener') ; // + data.toString() );

if (! data)
    {
    return ;
    }

switch (data.action)
    {
    case 'console_update' :
	for (update_idx = 0 ; update_idx < data.updates.length ; update_idx++)
	    {
	    switch (data.updates[update_idx].id)
		{
	    	case 'instruction_display' :
		    instruction_display (data.updates[update_idx].value) ;
		    break ;
	    	case 'memory_data_display' :
		    memory_data_display (data.updates[update_idx].value) ;
		    break ;
	    	case 'memory_address_display' :
		    memory_address_display (data.updates[update_idx].value) ;
		    break ;
	    	case 'instruction_address_display' :
		    instruction_address_display (data.updates[update_idx].value) ;
		    break ;
	    	case 'sense_switch_6_light' :
	    	case 'sense_switch_5_light' :
	    	case 'sense_switch_4_light' :
	    	case 'sense_switch_3_light' :
	    	case 'sense_switch_2_light' :
	    	case 'sense_switch_1_light' :
	    	case 'halt_light' :
		    update_red_light (data.updates[update_idx]) ;
		    break ;
	    	case 'console_printer_light' :
	    	case 'disk_file_data_com_light' :
	    	case 'tape_light' :
	    	case 'printer_light' :
	    	case 'punch_light' :
	    	case 'reader_2_sorter_light' :
	    	case 'reader_1_light' :
	    	case 'central_processor_light' :
		    update_indicator_light (data.updates[update_idx]) ;
		    break ;
	    	case 'continue_light' :
	    	case 'power_on_light' :
		    update_green_light (data.updates[update_idx]) ;
		    break ;
	    	default :
		    break ;
		}
	    }
	break ;
    case 'hello':
	//alert ('hello') ;
	break ;
    case 'panel_light':
	//alert (data.id) ;
	switch (data.id)
	    {
	    case 'instruction_display' :
		instruction_display (data.value) ;
		break ;
	    case 'memory_data_display' :
		memory_data_display (data.value) ;
		break ;
	    case 'memory_address_display' :
		memory_address_display (data.value) ;
		break ;
	    case 'instruction_address_display' :
		instruction_address_display (data.value) ;
		break ;
	    default :
		break ;
	    }
      	break;
    case 'alert':
	alert ('listener alert:' + data.alert) ;
	break ;
    case 'memdump':
	alert (data.text) ;
	break ;
    default:
      	alert ('Unknown command' + data.action);
    }

}
//}, false);

worker.postMessage({'action':'hello'});

//------------------------------------------------------------------------------
// set_bit_switches
//------------------------------------------------------------------------------
function set_bit_switches
    (
    element_ids,
    switch_data
    )
{

$.each (element_ids, function (bit_idx, bit_ids)
    {
    if (bit_ids [0])
        {
        if ((switch_data [0] >>> bit_idx) & 0x01)
            {
            $(bit_ids[0]).removeClass('bit_switch_off').addClass("bit_switch_on") ;
            }
	else
            {
            $(bit_ids[0]).removeClass('bit_switch_on').addClass("bit_switch_off") ;
            }
        }
    if (bit_ids [1])
        {
        if ((switch_data [1] >>> bit_idx) & 0x01)
            {
            $(bit_ids[1]).removeClass('bit_switch_off').addClass("bit_switch_on") ;
            }
	else
            {
            $(bit_ids[1]).removeClass('bit_switch_on').addClass("bit_switch_off") ;
            }
        }
    if (bit_ids [2])
        {
        if ((switch_data [2] >>> bit_idx) & 0x01)
            {
            $(bit_ids[2]).removeClass('bit_switch_off').addClass("bit_switch_on") ;
            }
	else
            {
            $(bit_ids[2]).removeClass('bit_switch_on').addClass("bit_switch_off") ;
            }
        }
    }) ;

} // set_bit_switches //

//------------------------------------------------------------------------------
// instruction_display - display op, m variant, n variant
//------------------------------------------------------------------------------
function instruction_display (instruction)
{
var element_ids =
    [
    ["#inst_o_bit_1", "#inst_m_bit_1", "#inst_n_bit_1"] ,
    ["#inst_o_bit_2", "#inst_m_bit_2", "#inst_n_bit_2"] ,
    ["#inst_o_bit_4", "#inst_m_bit_4", "#inst_n_bit_4"] ,
    ["#inst_o_bit_8", "#inst_m_bit_8", "#inst_n_bit_8"] ,
    ["#inst_o_bit_a", "#inst_m_bit_a", ""] ,
    ["#inst_o_bit_b", "#inst_m_bit_b", ""]
    ] ;

set_bit_switches (element_ids, instruction) ;

} // instruction_display //

//------------------------------------------------------------------------------
// memory_data_display - display memory data on panel
//------------------------------------------------------------------------------
function memory_data_display
    (
    mem_data
    )
{
var element_ids =
    [
    ["#mem_disp_bit_1", "", ""] ,
    ["#mem_disp_bit_2", "", ""] ,
    ["#mem_disp_bit_4", "", ""] ,
    ["#mem_disp_bit_8", "", ""] ,
    ["#mem_disp_bit_a", "", ""] ,
    ["#mem_disp_bit_b", "", ""] ,
    ["#mem_disp_bit_p", "", ""]
    ] ;

set_bit_switches (element_ids, mem_data) ;

} // memory_data_display //

//------------------------------------------------------------------------------
// memory_address_display - display memory address on panel
//------------------------------------------------------------------------------
memory_address_display = function (address)
{
var element_ids =
    [
    ["#mem_section_bit_1", "#mem_field_bit_1", "#mem_char_bit_1"] ,
    ["#mem_section_bit_2", "#mem_field_bit_2", "#mem_char_bit_2"] ,
    ["#mem_section_bit_4", "#mem_field_bit_4", "#mem_char_bit_4"] ,
    ["#mem_section_bit_8", "#mem_field_bit_8", "#mem_char_bit_8"] ,
    ["#mem_section_bit_a", "#mem_field_bit_a", ""] ,
    ["#mem_section_bit_b", "#mem_field_bit_b", ""]
    ] ;

set_bit_switches (element_ids, address) ;

} // memory_address_display //

//------------------------------------------------------------------------------
// instruction_address_display - display instruction address on panel
//------------------------------------------------------------------------------
instruction_address_display = function (address)
{
var element_ids =
    [
    ["#inst_section_bit_1", "#inst_field_bit_1", ""] ,
    ["#inst_section_bit_2", "#inst_field_bit_2", ""] ,
    ["#inst_section_bit_4", "#inst_field_bit_4", ""] ,
    ["#inst_section_bit_8", "#inst_field_bit_8", ""] ,
    ["#inst_section_bit_a", "#inst_field_bit_a", ""] ,
    ["#inst_section_bit_b", "#inst_field_bit_b", ""]
    ] ;

set_bit_switches (element_ids, address) ;

} // instruction_address_display //



//------------------------------------------------------------------------------
// update_green_light
//------------------------------------------------------------------------------
function update_green_light (data)
{
if (data.value)
    {
    $('#' + data.id).removeClass ('light_green_off_td')
		    .addClass('light_green_on_td') ;
    }
else
    {
    $('#' + data.id).removeClass ('light_green_on_td')
		    .addClass('light_green_off_td') ;
    }

} // update_green_light //

//------------------------------------------------------------------------------
// update_red_light
//------------------------------------------------------------------------------
function update_red_light (data)
{
if (data.value)
    {
    $('#' + data.id).removeClass ('light_red_off_td')
		    .addClass('light_red_on_td') ;
    }
else
    {
    $('#' + data.id).removeClass ('light_red_on_td')
		    .addClass('light_red_off_td') ;
    }

} // update_red_light //

//------------------------------------------------------------------------------
// update_indicator_light
//------------------------------------------------------------------------------
function update_indicator_light (data)
{
if (data.value)
    {
    $('.ind_light_td').removeClass ('light_red_on_td')
		    	.addClass('light_red_off_td') ;
    $('#' + data.id).removeClass ('light_red_off_td')
		    .addClass('light_red_on_td') ;
    }
else
    {
    $('#' + data.id).removeClass ('light_red_on_td')
		    .addClass('light_red_off_td') ;
    }

} // update_indicator_light //

//------------------------------------------------------------------------------
// increase_read_pressed
//------------------------------------------------------------------------------
function increase_read_pressed ()
{
worker.postMessage({"action":"button_pressed",
		    "button":"memory_increase_read"});


} // increase_read_pressed //

//------------------------------------------------------------------------------
// clear_pressed
//------------------------------------------------------------------------------
function clear_pressed ()
{

worker.postMessage({"action":"button_pressed",
		    "button":"clear"});

} // clear_pressed //

//------------------------------------------------------------------------------
// halt_pressed
//------------------------------------------------------------------------------
function halt_pressed ()
{

worker.postMessage({"action":"button_pressed",
		    "button":"halt"});

} // halt_pressed //

//------------------------------------------------------------------------------
// continue_pressed
//------------------------------------------------------------------------------
function continue_pressed ()
{

worker.postMessage({"action":"button_pressed",
		    "button":"continue"});

} // continue_pressed //


function run_it ()
{


}

$(document).ready ()
{
//alert ('ready') ;
//run_it () ;
}
