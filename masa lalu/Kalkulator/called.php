<?php
$q=$_GET["q"];
$s=$_GET["s"];
$t=$_GET["t"];
$host = "localhost";
$user = "root";
$pass = "";
$db = "smep_2013";

$con=mysql_connect($host, $user, $pass, $db);
$tabel=mysql_select_db($db, $con);

$sql = "SELECT * from tb_program WHERE tb_program.id_skpd = '".$q."' ";
$result = mysql_query($sql,$con);
$go = '';

//$sql2 = "SELECT * from tb_kegiatan WHERE id_kegiatan = "

while($row = mysql_fetch_object($result))
{
		echo "<table align=left width ='100%'>";
		#echo "<th></th>";
		echo "<tr width ='100%'>";
		echo "<td>" . "<b>" . $row->nama_prog . "<br>" . "</b>" . "</td>";
		echo "<td width='10%'>" . "0" . "</td>";
		echo "<td width='10%'>" . "0" . "</td>";
		echo "<td width='10%'>" . "0" . "</td>";
		echo "<td width='10%'>" . "0" . "</td>";
		echo "<td width='10%'>" . "0" . "</td>";
		echo "<td width='10%'>" . "0" . "</td>";
		//echo "<br>";
		$trek = $row->id_prog;
		#echo "</tr>"
		$sql1 = "SELECT nama_keg, id_kegiatan from tb_kegiatan WHERE id_prog = '".$trek."' AND thn_angg = '".$s."'";
		$result2 = mysql_query($sql1,$con);
		while($row1 = mysql_fetch_object($result2))
		{
			echo "<table border='1' width ='100%'>";			
			echo "<tr border='1' width ='50%'>";
				echo "<td>";
				echo "<ul>" . $row1->nama_keg . "</ul>";
				echo "</td>";
				$keg = $row1->id_kegiatan;
// ini renc anggaran >>				
			$sql4 = "SELECT sum(keuangan) as jumlahrenc FROM tb_renc_ang WHERE id_kegiatan = '".$keg."'";
			$result4 = mysql_query($sql4,$con);
			while($row4 = mysql_fetch_object($result4))
			{
				$sumb = $row4->jumlahrenc;
				echo "<td align=right width='10%'>";
				echo $sumb;
				echo "</td>";
			}	
			
			$persql1 = "SELECT tb_kegiatan.id_kegiatan, tb_kegiatan.id_prog, sum(keuangan) as allkeuangan, triwulan FROM tb_renc_ang INNER JOIN tb_kegiatan WHERE tb_renc_ang.id_kegiatan = tb_kegiatan.id_kegiatan AND tb_kegiatan.id_prog = '".$trek."'";
			$perresult1 = mysql_query($persql1,$con);
			while($perrow1 = mysql_fetch_object($perresult1))
			{
				$perhash = round(($sumb/($perrow1->allkeuangan))*100,2);
				echo "<td align=center width='10%'>";
				echo $perhash . " %";
				echo "</td>";
			}
			
// ini real anggaran >>				
			$sql3 = "SELECT sum(nominal) as jumlahreal FROM tb_real_angg WHERE id_kegiatan = '".$keg."'";
			$result3 = mysql_query($sql3,$con);
			while($row2 = mysql_fetch_object($result3))
			{
				$bb = $row2->jumlahreal;
				$perreal = round(($bb/$sumb)*100,2);
				$sisa = $sumb-$bb;
				$persisa = round(($sisa/$sumb)*100,2);			
				echo "<td align=right width='10%'>";
				echo $bb;
				echo "</td>";
				echo "<td align=center width='10%'>";
				echo $perreal . "%";
				echo "</td>";
				echo "<td align=right width='10%'>";
				echo $sisa;
				echo "</td>";
				echo "<td align=center width='10%'>";
				echo $persisa . " %";
				echo "</td>";
			}
			
			
		
			/**$sql4 = "SELECT keuangan FROM tb_renc_ang WHERE tb_kegiatan.id_kegiatan = tb_renc_ang.id_kegiatan AND id_kegiatan = '".$keg."'";
			$result4 = mysql_query($sql4,$con);
			while($row4 = mysql_fetch_object($result4))
			{
				echo "<td width='20%'>";
				echo $row->keuangan; 
				echo "</td>"; 
			}**/
			echo "</tr>";
			echo "</table>";
		}
		
		/**echo "<td>" . $row->thn_angg . "</td>";
		echo "<br>";
		$trek2 = $row->id_prog;
		$sql3 = "SELECT id_kegiatan as id FROM tb_kegiatan WHERE id_prog = '".$trek2."'";
		$result3 = mysql_query($sql3.$con);
		while($row1 = mysql_fetch_object($result3))
		{
			echo "<ul>" . $row1->id_kegiatan . "<ul>";
		}**/
		echo "<br>";
		echo "</tr>";
		echo "</table>";
}



mysql_close($con);
?>
