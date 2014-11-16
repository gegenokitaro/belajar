/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

import absencli.arraysiswa;
import absencli.pilihan;
import java.util.Arrays;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author kagura
 */
public class junit {
    
    public junit() {
    }
    
    @Test
    public void tes() {
        String a = "Andi";
        pilihan.prosmas(a);
        String b;
        int k;
        k = Arrays.asList(arraysiswa.ere1).indexOf("Andi");
        b = String.valueOf(arraysiswa.ere2[k]);
        
        String r;
        r = "Masuk";
        assertEquals(b, r);
    }
    
    @Test
    public void tampil() {
        String[] a = arraysiswa.ere1;
        String[] b = arraysiswa.ere2;
        
        String[] x = pilihan.prostam(a, b);
        
        String[] tos1 =  {"Andi","Budi","Joko","Aziz",
                          "Oni","Gaga","Tony","Remon",
                          "Arch","Dzen","Termite","Pink",
                          "Ajikan","Ge","Goemon","Pinguin",
                          "Cetar","Pecut","Kamen","Candy",
                          "Katok","Huehue"};
        String[] tos2 =  {"Bolos","Bolos","Bolos","Bolos",
                          "Bolos","Bolos","Bolos","Bolos",
                          "Bolos","Bolos","Bolos","Bolos",
                          "Bolos","Bolos","Bolos","Bolos",
                          "Bolos","Bolos","Bolos","Bolos",
                          "Bolos","Bolos"};
        String[] result = pilihan.prostam(tos1, tos2);
        assertArrayEquals(x, result);
    }
    
    @BeforeClass
    public static void setUpClass() {
    }
    
    @AfterClass
    public static void tearDownClass() {
    }
    
    @Before
    public void setUp() {
    }
    
    @After
    public void tearDown() {
    }
    // TODO add test methods here.
    // The methods must be annotated with annotation @Test. For example:
    //
    // @Test
    // public void hello() {}
}