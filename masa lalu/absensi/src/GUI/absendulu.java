/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package GUI;
/**
 *
 * @author kagura
 */
public class absendulu {
    String input = GUI.teks.getText();
    
    
    public void tambahabsensi() {
        GUI.arraymhs[GUI.i] = input; 
    }
    
    public void refresh() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < GUI.arraymhs.length; i++) {
            sb.append(String.valueOf(GUI.arraymhs[i]));
            sb.append('\n');            
        }
        GUI.area.setText(sb.toString());
    }

}
