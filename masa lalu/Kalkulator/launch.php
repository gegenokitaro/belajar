<html>
<head>
<title></title>
<style>
table, td, th
{
border:0.5px inset black;
font-family: Helvetica;
}
th
{
background-color:#3399CC;
color:white;
}
td
{
background-color:#E8E8E8;
}
label
{
font-family: Helvetica;
}
option
{
font-family: Helvetica;
}
body
{
font-family: Helvetica;
}
</style>
<script>
function showUser()
{
var user = document.getElementById("users").options[document.getElementById("users").selectedIndex].value; 
var year = document.getElementById("year").options[document.getElementById("year").selectedIndex].value; 
var wul = document.getElementById("tri").options[document.getElementById("tri").selectedIndex].value; 

if (year=="")
  {
  document.getElementById("txtHint").innerHTML="";
  return;
  } 
if (window.XMLHttpRequest)
  {// code for IE7+, Firefox, Chrome, Opera, Safari
  xmlhttp=new XMLHttpRequest();
  }
else
  {// code for IE6, IE5
  xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
xmlhttp.onreadystatechange=function()
  {
  if (xmlhttp.readyState==4 && xmlhttp.status==200)
    {
    document.getElementById("txtHint").innerHTML=xmlhttp.responseText;
    }
  }
xmlhttp.open("GET","called.php?q="+user+"&s="+year+"&t="+wul,true);
xmlhttp.send();
}
</script>
</head>
<body>

<form>
<label for="users">Pilih Program</label>
<select id="users" onchange="showUser()">
<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "smep_2013";

$con=mysql_connect($host, $user, $pass, $db);
$tabel=mysql_select_db($db, $con);

$skpd = "SELECT * FROM tb_skpd";

$queskpd = mysql_query($skpd,$con);


$thn = "";

$tri = "";

while($rowskpd = mysql_fetch_object($queskpd)) { 
	echo "<option value='".$rowskpd->id_skpd."' >" . $rowskpd->nama_instansi . "</option>";
} 
?>
<!--option value="">Select a person:</option>
<option value="1">Peter Griffin</option>
<option value="2">Lois Griffin</option>
<option value="3">Glenn Quagmire</option>
<option value="4">Joseph Swanson</option-->
</select>
<label for="year">Tahun</label>
<select id="year" onchange="showUser()">
<option value="2012">2012</option>
<option value="2013">2013</option>
</select>
<label for="tri">Triwulan</label>
<select id="tri" onchange="showUser()">
<option value="1">1</option>
<option value="2">2</option>
<option value="3">3</option>
<option value="4">4</option>
</select>
</form>
<table width ='100%'>
<tr>
<th rowspan=3 >Program / Kegiatan</th>
<th colspan=2 width='20%'>Rencana</th>
<th colspan=2 width='20%'>Realisasi</th>
<th colspan=2 width='20%'>Sisa</th>
</tr>
<tr>
	<td style='background-color:#3399CC;color:white' width='10%' align=center>Keuangan</td>
	<td style='background-color:#3399CC;color:white' width='10%' align=center>Prosentase</td>
	<td style='background-color:#3399CC;color:white' width='10%' align=center>Keuangan</td>
	<td style='background-color:#3399CC;color:white' width='10%' align=center>Prosentase</td>
	<td style='background-color:#3399CC;color:white' width='10%' align=center>Keuangan</td>
	<td style='background-color:#3399CC;color:white' width='10%' align=center>Prosentase</td>
</tr>
</table>
<br>
<div id="txtHint"><b>Silahkan pilih daftar program untuk ditampilkan.</b></div>

</body>
</html>
