/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package absencli;

import java.util.Arrays;
import java.util.Scanner;

/**
 *
 * @author kagura
 */
public class pilihan {
    
    public static void masuk() {
        System.out.println("masukkan nama: ");
        Scanner j = new Scanner(System.in);
        String nama = j.nextLine();
        
        prosmas(nama);
    }
    
    public static void tampil() {
        prostam(arraysiswa.ere1, arraysiswa.ere2);
    }
    
    public static String prosmas(String x) {
        if(Arrays.asList(arraysiswa.ere1).contains(x)) {
            int ind = Arrays.asList(arraysiswa.ere1).indexOf(x);
            if("Bolos".equals(arraysiswa.ere2[ind])) {
                arraysiswa.ere2[ind] = "Masuk";
                System.out.println("sudah terdata");
            } else {
                System.out.println("sudah absen tadi");
            }
        } else {
            System.out.println("salah kelas");
        }
        return x;        
    }
    
    public static String[] prostam(String[] a, String[] b) {
        for (int i = 0; i < a.length; i++) {            
            System.out.println(a[i]+"\t\t"+b[i]);            
        }
        return null;
    }
}
